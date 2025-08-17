-- SQLite Schema for AIML Pattern Storage and Matching
-- Optimized for A.L.I.C.E. chatbot implementation
-- 
-- This schema is designed for:
-- 1. Fast pattern matching using indexed searches
-- 2. Efficient wildcard matching with priority ordering
-- 3. Context-aware responses (that/topic conditions)
-- 4. Template rendering with AIML tag support
-- 5. Immutable, read-only pattern storage for production deployment

-- Main categories table stores all AIML categories
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_name TEXT NOT NULL,           -- Source collection (alice_foundation, etc.)
    file_name TEXT NOT NULL,                 -- Source AIML file
    pattern TEXT NOT NULL,                   -- Original pattern text
    template TEXT NOT NULL,                  -- Template with AIML tags
    that_pattern TEXT DEFAULT NULL,          -- Optional <that> condition
    topic_pattern TEXT DEFAULT NULL,         -- Optional topic condition
    priority INTEGER DEFAULT 0,             -- Pattern priority (0=highest, higher=lower)
    wildcard_count INTEGER DEFAULT 0,       -- Number of wildcards (* and _)
    pattern_length INTEGER DEFAULT 0,       -- Pattern length for sorting
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pattern words table for efficient pattern matching
-- Each word in a pattern becomes a separate record for indexing
CREATE TABLE pattern_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    word_position INTEGER NOT NULL,         -- Position of word in pattern (0-based)
    word TEXT NOT NULL,                     -- Actual word or wildcard
    is_wildcard INTEGER DEFAULT 0,         -- 1 if word is * or _, 0 otherwise
    word_type TEXT DEFAULT 'LITERAL',      -- LITERAL, STAR, UNDERSCORE
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Templates table stores parsed template components for efficient rendering
CREATE TABLE template_elements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    element_position INTEGER NOT NULL,      -- Position in template (0-based)
    element_type TEXT NOT NULL,            -- TEXT, STAR, SRAI, RANDOM, etc.
    element_content TEXT,                  -- Content/attributes as JSON
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Bot properties schema - defines required runtime properties but stores no values
CREATE TABLE bot_property_schema (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_name TEXT UNIQUE NOT NULL,    -- Property name used in <bot name=""/> tags
    description TEXT NOT NULL,             -- What this property represents
    required INTEGER DEFAULT 1,           -- 1 if required, 0 if optional
    default_value TEXT                     -- Optional fallback value
);

-- Bot property usage tracking - backlinks from categories to properties
CREATE TABLE category_bot_properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,         -- Reference to categories table
    property_name TEXT NOT NULL,          -- Bot property name used in template
    usage_count INTEGER DEFAULT 1,       -- How many times property appears in this template
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Indexes for fast pattern matching
CREATE INDEX idx_categories_pattern ON categories(pattern);
CREATE INDEX idx_categories_priority ON categories(priority, wildcard_count, pattern_length);
CREATE INDEX idx_categories_collection ON categories(collection_name);
CREATE INDEX idx_categories_that ON categories(that_pattern) WHERE that_pattern IS NOT NULL;
CREATE INDEX idx_categories_topic ON categories(topic_pattern) WHERE topic_pattern IS NOT NULL;

-- Pattern word indexes for efficient matching
CREATE INDEX idx_pattern_words_category ON pattern_words(category_id);
CREATE INDEX idx_pattern_words_word ON pattern_words(word);
CREATE INDEX idx_pattern_words_position ON pattern_words(category_id, word_position);
CREATE INDEX idx_pattern_words_wildcard ON pattern_words(is_wildcard);

-- Template element indexes
CREATE INDEX idx_template_elements_category ON template_elements(category_id);
CREATE INDEX idx_template_elements_position ON template_elements(category_id, element_position);

-- Bot property schema lookup
CREATE INDEX idx_bot_property_schema_name ON bot_property_schema(property_name);

-- Bot property usage indexes for fast backlink lookups
CREATE INDEX idx_category_bot_properties_category ON category_bot_properties(category_id);
CREATE INDEX idx_category_bot_properties_property ON category_bot_properties(property_name);
CREATE INDEX idx_category_bot_properties_lookup ON category_bot_properties(property_name, category_id);

-- Views for common queries

-- Pattern matching priority view
CREATE VIEW pattern_priority AS
SELECT 
    c.id,
    c.pattern,
    c.template,
    c.that_pattern,
    c.topic_pattern,
    c.collection_name,
    c.file_name,
    -- Priority calculation: exact matches first, then by wildcard count, then by length
    CASE 
        WHEN c.wildcard_count = 0 THEN 0  -- Exact patterns have highest priority
        WHEN c.wildcard_count = 1 THEN 1000 + c.pattern_length  -- Single wildcards
        ELSE 2000 + c.wildcard_count * 100 + c.pattern_length   -- Multiple wildcards
    END as calculated_priority
FROM categories c
ORDER BY calculated_priority ASC, c.id ASC;

-- Pattern statistics view for analysis
CREATE VIEW pattern_statistics AS
SELECT 
    collection_name,
    COUNT(*) as total_patterns,
    COUNT(CASE WHEN wildcard_count = 0 THEN 1 END) as exact_patterns,
    COUNT(CASE WHEN wildcard_count > 0 THEN 1 END) as wildcard_patterns,
    AVG(wildcard_count) as avg_wildcards,
    AVG(pattern_length) as avg_pattern_length,
    COUNT(CASE WHEN that_pattern IS NOT NULL THEN 1 END) as context_patterns,
    COUNT(CASE WHEN topic_pattern IS NOT NULL THEN 1 END) as topic_patterns
FROM categories 
GROUP BY collection_name;

-- Bot property usage analysis view
CREATE VIEW property_usage_analysis AS
SELECT 
    cbp.property_name,
    COUNT(DISTINCT cbp.category_id) as categories_using_property,
    SUM(cbp.usage_count) as total_usage_count,
    COUNT(DISTINCT c.collection_name) as collections_using_property,
    GROUP_CONCAT(DISTINCT c.collection_name) as collection_list
FROM category_bot_properties cbp
JOIN categories c ON cbp.category_id = c.id
GROUP BY cbp.property_name
ORDER BY total_usage_count DESC;

-- Categories by property lookup view - for finding all rules using a specific property
CREATE VIEW categories_by_property AS
SELECT 
    cbp.property_name,
    c.id as category_id,
    c.collection_name,
    c.file_name,
    c.pattern,
    c.template,
    cbp.usage_count,
    c.priority,
    c.wildcard_count
FROM category_bot_properties cbp
JOIN categories c ON cbp.category_id = c.id
ORDER BY cbp.property_name, c.priority ASC;

-- Bot property schema will be populated from bot_properties.yaml during build
-- This table structure defines the schema but data comes from YAML file

-- Trigger to update pattern metadata when inserting categories
CREATE TRIGGER update_pattern_metadata 
AFTER INSERT ON categories
BEGIN
    UPDATE categories 
    SET 
        wildcard_count = (
            LENGTH(NEW.pattern) - LENGTH(REPLACE(REPLACE(NEW.pattern, '*', ''), '_', ''))
        ),
        pattern_length = LENGTH(TRIM(NEW.pattern))
    WHERE id = NEW.id;
END;