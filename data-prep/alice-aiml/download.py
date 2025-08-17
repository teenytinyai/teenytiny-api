#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "aiohttp>=3.9.0",
#     "aiofiles>=23.0.0", 
#     "pyyaml>=6.0.0",
#     "rich>=13.0.0",
#     "click>=8.1.0"
# ]
# ///

"""
AIML File Downloader

A robust, parallel downloader for AIML files from various collections.
Features incremental downloads, ETag caching, atomic writes, and rich progress display.

Usage:
    ./download.py                              # Download all collections
    ./download.py alice_foundation mitsuku    # Download specific collections
    ./download.py --force                     # Force re-download all files
    ./download.py --max-concurrent 20         # Set concurrency limit
"""

import asyncio
import hashlib
import json
import os
import signal
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urlparse

import aiofiles
import aiohttp
import click
import yaml
from rich.console import Console
from rich.progress import (
    BarColumn,
    MofNCompleteColumn,
    Progress,
    TaskID,
    TextColumn,
    TimeElapsedColumn,
    TimeRemainingColumn,
)
from rich.table import Table

console = Console()

# Configuration
SCRIPT_DIR = Path(__file__).parent
SOURCES_DIR = SCRIPT_DIR / "sources"
WORK_DIR = SCRIPT_DIR / "work"
DOWNLOADS_DIR = WORK_DIR / "downloads"
METADATA_DIR = WORK_DIR / "metadata"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
RETRY_ATTEMPTS = 3
RETRY_DELAY = 1.0


class DownloadError(Exception):
    """Custom exception for download errors."""
    pass


class FileMetadata:
    """Manages file metadata for incremental downloads."""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self.metadata_file = METADATA_DIR / f"{collection_name}.json"
        self.data: Dict[str, Dict] = {}
        self.load()
    
    def load(self) -> None:
        """Load metadata from disk."""
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r') as f:
                    self.data = json.load(f)
            except (json.JSONDecodeError, OSError) as e:
                console.print(f"[yellow]Warning: Could not load metadata for {self.collection_name}: {e}")
                self.data = {}
    
    def save(self) -> None:
        """Save metadata to disk."""
        self.metadata_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.metadata_file, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def get_file_info(self, filename: str) -> Optional[Dict]:
        """Get cached file information."""
        return self.data.get(filename)
    
    def update_file_info(self, filename: str, etag: Optional[str], 
                        last_modified: Optional[str], file_hash: str, 
                        size: int) -> None:
        """Update file metadata."""
        self.data[filename] = {
            'etag': etag,
            'last_modified': last_modified,
            'hash': file_hash,
            'size': size,
            'downloaded_at': asyncio.get_event_loop().time()
        }


class AIMLDownloader:
    """Main downloader class."""
    
    def __init__(self, max_concurrent: int = 10, force_download: bool = False):
        self.max_concurrent = max_concurrent
        self.force_download = force_download
        self.session: Optional[aiohttp.ClientSession] = None
        self.semaphore = asyncio.Semaphore(max_concurrent)
        
        # Statistics
        self.stats = {
            'downloaded': 0,
            'skipped': 0,
            'errors': 0,
            'validation_errors': 0,
            'total_size': 0
        }
    
    async def __aenter__(self):
        """Async context manager entry."""
        connector = aiohttp.TCPConnector(limit=self.max_concurrent * 2)
        timeout = aiohttp.ClientTimeout(total=300, connect=30)
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'User-Agent': 'AIML-Downloader/1.0'}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            try:
                await asyncio.wait_for(self.session.close(), timeout=5.0)
            except asyncio.TimeoutError:
                console.print("[yellow]Session close timeout, forcing exit")
            except Exception as e:
                console.print(f"[yellow]Session close error: {e}")
    
    def load_source_files(self, collections: Optional[List[str]] = None) -> Dict[str, Dict]:
        """Load YAML source files."""
        sources = {}
        
        if not SOURCES_DIR.exists():
            raise DownloadError(f"Sources directory not found: {SOURCES_DIR}")
        
        for yaml_file in SOURCES_DIR.glob("*.yaml"):
            collection_name = yaml_file.stem
            
            # Filter by requested collections
            if collections and collection_name not in collections:
                continue
            
            try:
                with open(yaml_file, 'r') as f:
                    data = yaml.safe_load(f)
                sources[collection_name] = data
            except yaml.YAMLError as e:
                console.print(f"[red]Error loading {yaml_file}: {e}")
                continue
        
        if not sources:
            available = [f.stem for f in SOURCES_DIR.glob("*.yaml")]
            raise DownloadError(
                f"No valid collections found. Available: {', '.join(available)}"
            )
        
        return sources
    
    def validate_url(self, url: str) -> bool:
        """Validate URL format."""
        try:
            parsed = urlparse(url)
            return all([parsed.scheme, parsed.netloc, parsed.path])
        except Exception:
            return False
    
    async def validate_xml_file(self, file_path: Path) -> bool:
        """Validate that a file is well-formed XML and contains AIML content."""
        try:
            # Read file content
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                content = await f.read()
            
            # Check for basic XML structure
            if not content.strip():
                console.print(f"[red]Empty file: {file_path.name}")
                return False
            
            # Parse XML to check if it's well-formed
            try:
                root = ET.fromstring(content)
            except ET.ParseError as e:
                console.print(f"[red]XML parse error in {file_path.name}: {e}")
                return False
            
            # Basic AIML validation - check for required elements
            if file_path.suffix.lower() == '.aiml':
                # Must have aiml root element
                if root.tag.lower() != 'aiml':
                    console.print(f"[yellow]Warning: {file_path.name} root element is '{root.tag}', expected 'aiml'")
                
                # Should have at least one category element
                categories = root.findall('.//category')
                if not categories:
                    console.print(f"[yellow]Warning: {file_path.name} has no <category> elements")
                else:
                    # Check that categories have pattern and template
                    for i, category in enumerate(categories[:3]):  # Check first 3 categories
                        pattern = category.find('pattern')
                        template = category.find('template')
                        if pattern is None:
                            console.print(f"[yellow]Warning: {file_path.name} category {i+1} missing <pattern>")
                        if template is None:
                            console.print(f"[yellow]Warning: {file_path.name} category {i+1} missing <template>")
            
            return True
            
        except Exception as e:
            console.print(f"[red]Validation error for {file_path.name}: {e}")
            return False
    
    async def check_file_needs_download(self, url: str, local_path: Path, 
                                      metadata: FileMetadata) -> Tuple[bool, Dict]:
        """Check if file needs to be downloaded using HTTP HEAD request."""
        filename = local_path.name
        
        # Force download if requested
        if self.force_download:
            return True, {}
        
        # Check if local file exists
        if not local_path.exists():
            return True, {}
        
        # Get cached metadata
        cached_info = metadata.get_file_info(filename)
        if not cached_info:
            return True, {}
        
        # Prepare conditional headers
        headers = {}
        if cached_info.get('etag'):
            headers['If-None-Match'] = cached_info['etag']
        if cached_info.get('last_modified'):
            headers['If-Modified-Since'] = cached_info['last_modified']
        
        try:
            async with self.semaphore:
                async with self.session.head(url, headers=headers) as response:
                    if response.status == 304:  # Not Modified
                        return False, {}
                    elif response.status == 200:
                        return True, {
                            'etag': response.headers.get('ETag'),
                            'last_modified': response.headers.get('Last-Modified'),
                            'content_length': response.headers.get('Content-Length')
                        }
                    else:
                        console.print(f"[yellow]Unexpected HEAD response {response.status} for {url}")
                        return True, {}
        except Exception as e:
            console.print(f"[yellow]HEAD request failed for {url}: {e}, will try download")
            return True, {}
    
    async def download_file(self, url: str, local_path: Path, 
                          metadata: FileMetadata, progress: Progress, 
                          task_id: TaskID) -> bool:
        """Download a single file with error handling and progress tracking."""
        filename = local_path.name
        temp_path = local_path.with_suffix(local_path.suffix + '.tmp')
        
        # Ensure directory exists
        local_path.parent.mkdir(parents=True, exist_ok=True)
        
        for attempt in range(RETRY_ATTEMPTS):
            try:
                async with self.semaphore:
                    # Check if file needs download
                    needs_download, headers_info = await self.check_file_needs_download(
                        url, local_path, metadata
                    )
                    
                    if not needs_download:
                        self.stats['skipped'] += 1
                        progress.update(task_id, advance=1, description=f"Skipped {filename}")
                        return True
                    
                    # Download file
                    async with self.session.get(url) as response:
                        if response.status != 200:
                            raise DownloadError(f"HTTP {response.status}: {response.reason}")
                        
                        # Check file size
                        content_length = response.headers.get('Content-Length')
                        if content_length and int(content_length) > MAX_FILE_SIZE:
                            raise DownloadError(f"File too large: {content_length} bytes")
                        
                        # Download to temporary file
                        file_hash = hashlib.sha256()
                        file_size = 0
                        
                        async with aiofiles.open(temp_path, 'wb') as f:
                            async for chunk in response.content.iter_chunked(8192):
                                await f.write(chunk)
                                file_hash.update(chunk)
                                file_size += len(chunk)
                        
                        # Validate XML structure
                        if filename.endswith('.aiml'):
                            is_valid = await self.validate_xml_file(temp_path)
                            if not is_valid:
                                self.stats['validation_errors'] += 1
                                raise DownloadError("File failed XML validation")
                        
                        # Atomic rename
                        temp_path.rename(local_path)
                        
                        # Update metadata
                        metadata.update_file_info(
                            filename,
                            response.headers.get('ETag') or headers_info.get('etag'),
                            response.headers.get('Last-Modified') or headers_info.get('last_modified'),
                            file_hash.hexdigest(),
                            file_size
                        )
                        
                        self.stats['downloaded'] += 1
                        self.stats['total_size'] += file_size
                        progress.update(task_id, advance=1, description=f"Downloaded {filename}")
                        return True
            
            except Exception as e:
                # Clean up temp file on error
                if temp_path.exists():
                    temp_path.unlink()
                
                if attempt == RETRY_ATTEMPTS - 1:
                    self.stats['errors'] += 1
                    console.print(f"[red]Failed to download {url}: {e}")
                    progress.update(task_id, advance=1, description=f"Failed {filename}")
                    return False
                else:
                    await asyncio.sleep(RETRY_DELAY * (2 ** attempt))
        
        return False
    
    async def download_collection(self, collection_name: str, collection_data: Dict,
                                progress: Progress) -> bool:
        """Download all files in a collection."""
        files = collection_data.get('files', [])
        if not files:
            console.print(f"[yellow]No files found in collection: {collection_name}")
            return True
        
        # Create collection-specific progress task
        task_id = progress.add_task(f"[cyan]{collection_name}", total=len(files))
        
        # Initialize metadata
        metadata = FileMetadata(collection_name)
        collection_dir = DOWNLOADS_DIR / collection_name
        
        # Process files with controlled concurrency
        semaphore = asyncio.Semaphore(min(self.max_concurrent, len(files)))
        
        async def download_with_semaphore(file_info):
            async with semaphore:
                url = file_info.get('url')
                if not url or not self.validate_url(url):
                    console.print(f"[red]Invalid URL in {collection_name}: {url}")
                    progress.update(task_id, advance=1)
                    return False
                
                filename = Path(urlparse(url).path).name
                local_path = collection_dir / filename
                
                return await self.download_file(url, local_path, metadata, progress, task_id)
        
        # Execute downloads with proper exception handling
        try:
            results = await asyncio.gather(
                *[download_with_semaphore(file_info) for file_info in files],
                return_exceptions=True
            )
            
            # Count exceptions
            exceptions = [r for r in results if isinstance(r, Exception)]
            if exceptions:
                console.print(f"[yellow]{collection_name}: {len(exceptions)} download errors")
        
        except Exception as e:
            console.print(f"[red]Collection {collection_name} failed: {e}")
            return False
        finally:
            # Always save metadata
            try:
                metadata.save()
            except Exception as e:
                console.print(f"[yellow]Failed to save metadata for {collection_name}: {e}")
        
        return True
    
    async def download_all(self, collections: Optional[List[str]] = None) -> None:
        """Download all collections."""
        # Setup directories
        WORK_DIR.mkdir(exist_ok=True)
        DOWNLOADS_DIR.mkdir(exist_ok=True)
        METADATA_DIR.mkdir(exist_ok=True)
        
        # Load source files
        sources = self.load_source_files(collections)
        
        console.print(f"[green]Starting download of {len(sources)} collections...")
        console.print(f"Max concurrent downloads: {self.max_concurrent}")
        
        success_count = 0
        
        # Create progress display with explicit refresh control
        try:
            with Progress(
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                MofNCompleteColumn(),
                TextColumn("({task.percentage:>3.0f}%)"),
                TimeElapsedColumn(),
                TimeRemainingColumn(),
                console=console,
                refresh_per_second=4  # Limit refresh rate
            ) as progress:
                
                # Process collections sequentially to avoid overwhelming async
                for name, data in sources.items():
                    try:
                        console.print(f"[blue]Processing collection: {name}")
                        result = await self.download_collection(name, data, progress)
                        if result:
                            success_count += 1
                        
                        # Small delay to prevent overwhelming
                        await asyncio.sleep(0.1)
                        
                    except Exception as e:
                        console.print(f"[red]Failed to process {name}: {e}")
                        continue
                
                # Ensure progress display completes
                await asyncio.sleep(0.5)
        
        except Exception as e:
            console.print(f"[red]Progress display error: {e}")
        
        # Print summary outside progress context
        console.print(f"\n[green]Successfully processed {success_count}/{len(sources)} collections")
        self.print_summary(sources)
    
    async def validate_existing_files(self, collections: Optional[List[str]] = None) -> None:
        """Validate existing downloaded files without re-downloading."""
        # Load source files
        sources = self.load_source_files(collections)
        
        console.print(f"[green]Validating {len(sources)} collections...")
        
        total_files = 0
        valid_files = 0
        invalid_files = 0
        missing_files = 0
        
        for collection_name, collection_data in sources.items():
            console.print(f"\n[blue]Validating collection: {collection_name}")
            collection_dir = DOWNLOADS_DIR / collection_name
            
            files = collection_data.get('files', [])
            for file_info in files:
                url = file_info.get('url')
                if not url:
                    continue
                
                filename = Path(urlparse(url).path).name
                local_path = collection_dir / filename
                total_files += 1
                
                if not local_path.exists():
                    console.print(f"[yellow]Missing: {filename}")
                    missing_files += 1
                    continue
                
                # Validate the file
                is_valid = await self.validate_xml_file(local_path)
                if is_valid:
                    valid_files += 1
                else:
                    invalid_files += 1
        
        # Print validation summary
        console.print(f"\n[bold green]Validation Summary[/bold green]")
        console.print(f"[green]Total files checked: {total_files}")
        console.print(f"[green]Valid files: {valid_files}")
        if invalid_files > 0:
            console.print(f"[red]Invalid files: {invalid_files}")
        if missing_files > 0:
            console.print(f"[yellow]Missing files: {missing_files}")
        
        if invalid_files == 0 and missing_files == 0:
            console.print("[green]✅ All files are valid and present!")
        else:
            console.print("[yellow]⚠️ Some files need attention")
    
    def print_summary(self, sources: Dict) -> None:
        """Print download summary."""
        console.print("\n[bold green]Download Summary[/bold green]")
        
        table = Table(show_header=True, header_style="bold blue")
        table.add_column("Collection")
        table.add_column("Status", justify="center")
        table.add_column("Files", justify="right")
        
        total_files = sum(len(data.get('files', [])) for data in sources.values())
        
        for name, data in sources.items():
            file_count = len(data.get('files', []))
            table.add_row(name, "✓", str(file_count))
        
        console.print(table)
        console.print(f"\n[green]Total files processed: {total_files}")
        console.print(f"[green]Downloaded: {self.stats['downloaded']}")
        console.print(f"[yellow]Skipped (unchanged): {self.stats['skipped']}")
        console.print(f"[red]Errors: {self.stats['errors']}")
        if self.stats['validation_errors'] > 0:
            console.print(f"[red]Validation errors: {self.stats['validation_errors']}")
        console.print(f"[blue]Total size: {self.stats['total_size'] / (1024*1024):.1f} MB")


def create_gitignore():
    """Create or update .gitignore to exclude work directory."""
    gitignore_path = SCRIPT_DIR / '.gitignore'
    work_entry = 'work/'
    
    if gitignore_path.exists():
        with open(gitignore_path, 'r') as f:
            content = f.read()
        if work_entry not in content:
            with open(gitignore_path, 'a') as f:
                f.write(f'\n# AIML downloader work directory\n{work_entry}\n')
    else:
        with open(gitignore_path, 'w') as f:
            f.write(f'# AIML downloader work directory\n{work_entry}\n')


@click.command()
@click.argument('collections', nargs=-1)
@click.option('--force', '-f', is_flag=True, help='Force re-download all files')
@click.option('--max-concurrent', '-c', default=10, help='Maximum concurrent downloads')
@click.option('--dry-run', is_flag=True, help='Show what would be downloaded without doing it')
@click.option('--validate-only', is_flag=True, help='Only validate existing files without downloading')
def main(collections: Tuple[str, ...], force: bool, max_concurrent: int, dry_run: bool, validate_only: bool):
    """Download AIML files from configured collections.
    
    COLLECTIONS: Optional list of collection names to download.
    If not specified, all collections will be downloaded.
    """
    if dry_run:
        console.print("[yellow]DRY RUN MODE - No files will be downloaded")
    
    # Create .gitignore
    create_gitignore()
    
    # Convert collections tuple to list
    collection_list = list(collections) if collections else None
    
    async def run_downloader():
        try:
            async with AIMLDownloader(max_concurrent, force) as downloader:
                if dry_run:
                    sources = downloader.load_source_files(collection_list)
                    console.print(f"[green]Would download {len(sources)} collections:")
                    for name, data in sources.items():
                        file_count = len(data.get('files', []))
                        console.print(f"  - {name}: {file_count} files")
                elif validate_only:
                    await downloader.validate_existing_files(collection_list)
                else:
                    # Add timeout for CI environments
                    await asyncio.wait_for(
                        downloader.download_all(collection_list), 
                        timeout=600.0  # 10 minutes max
                    )
        except asyncio.TimeoutError:
            console.print("[red]Download timed out after 10 minutes")
            raise
        except Exception as e:
            console.print(f"[red]Download error: {e}")
            raise

    # Setup signal handling
    def signal_handler(signum, frame):
        console.print(f"\n[yellow]Received signal {signum}, shutting down gracefully...")
        sys.exit(1)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        asyncio.run(run_downloader())
        console.print("[green]Download completed successfully!")
    except KeyboardInterrupt:
        console.print("\n[yellow]Download interrupted by user")
        sys.exit(1)
    except asyncio.TimeoutError:
        console.print("\n[red]Download timed out")
        sys.exit(1) 
    except Exception as e:
        console.print(f"\n[red]Download failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
