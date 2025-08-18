/**
 * Choice - Deterministic Item Selection for Testing
 * 
 * This utility solves a common problem in testing AI/generative models:
 * How do you test code that uses random selection without making tests flaky?
 * 
 * PROBLEM:
 * - Models use random selection (Math.random()) to pick words, templates, etc.
 * - Tests become flaky because they can't predict what will be selected
 * - Seeded random is hard to reason about - you can't tell what output to expect
 * 
 * SOLUTION:
 * Choice provides a queue-based system where:
 * - Runtime code uses random selection (default behavior)
 * - Tests can queue specific items to make behavior predictable
 * - Tests fail-fast if they don't queue enough items
 * 
 * MOCK-LIKE BEHAVIOR:
 * This is similar to a mock object, but for convenience it's the same instance
 * as that used at runtime. This cuts down boilerplate setup code - you don't
 * need to inject dependencies or create separate test instances.
 * 
 * USAGE AT RUNTIME:
 * ```typescript
 * const colors = new Choice(['red', 'blue', 'green']);
 * const randomColor = colors.pick(); // Returns random color
 * ```
 * 
 * USAGE IN TESTS:
 * ```typescript  
 * const colors = new Choice(['red', 'blue', 'green']);
 * colors.queue('red', 'blue'); // Next picks will return 'red', then 'blue'
 * 
 * const first = colors.pick(); // Returns 'red' 
 * const second = colors.pick(); // Returns 'blue'
 * const third = colors.pick(); // Throws error - queue exhausted!
 * ```
 * 
 * REAL WORLD EXAMPLE:
 * ```typescript
 * // In your model
 * class TextGenerator {
 *   adjectives = new Choice(['beautiful', 'terrible', 'amazing']);
 *   nouns = new Choice(['cat', 'storm', 'idea']);
 *   
 *   generate() {
 *     return `The ${this.nouns.pick()} is so ${this.adjectives.pick()}!`;
 *   }
 * }
 * 
 * // In your test
 * test('should generate expected phrase', () => {
 *   const generator = new TextGenerator();
 *   generator.nouns.queue('cat');
 *   generator.adjectives.queue('beautiful');
 *   
 *   expect(generator.generate()).toBe('The cat is so beautiful!'); // Predictable!
 * });
 * ```
 * 
 * FAIL-FAST BEHAVIOR:
 * If you queue items and then run out, Choice throws an error instead of 
 * falling back to random. This catches test setup bugs early:
 * 
 * ```typescript
 * colors.queue('red'); // Only queue one item
 * colors.pick(); // Returns 'red'
 * colors.pick(); // Throws: "Choice queue exhausted. Queue more items..."
 * ```
 * 
 * WHY FAIL-FAST?
 * - Catches under-provisioned test setups immediately
 * - Prevents tests from accidentally becoming flaky again
 * - Makes it clear when templates use more picks than expected
 * - Forces explicit test setup for complex scenarios
 */

export class Choice<T> {
  private pendingItems: T[] = [];
  private wasQueued = false;

  /**
   * Create a new Choice instance
   * 
   * IMPORTANT: Do not call this constructor directly. Use ChoiceRegistry.create() instead
   * to ensure proper deterministic behavior in tests.
   * 
   * @param items - Array of items to choose from
   * @param registry - ChoiceRegistry for deterministic testing (required)
   * @param name - Name for debugging (used in error messages)
   * @internal - This constructor should only be called by ChoiceRegistry
   */
  constructor(private items: T[], private registry?: any, private name?: string) {
    if (items.length === 0) {
      throw new Error('Choice cannot be created with empty items array');
    }
    
    // Fail if created without registry - prevents accidental unmanaged choices
    if (!registry) {
      throw new Error(
        'Choice cannot be created directly. ' +
        'Use ChoiceRegistry.create() instead to ensure deterministic testing support. ' +
        'This prevents accidentally creating unmanaged random choices.'
      );
    }
  }

  /**
   * Pick an item from the choice
   * 
   * - If items are queued, returns the next queued item
   * - If no items are queued, returns a random item
   * - If queue was used but is now empty, throws an error (fail-fast)
   * 
   * @returns The selected item
   * @throws Error if queue is exhausted after being used
   */
  pick(): T {
    // Return queued item first
    if (this.pendingItems.length > 0) {
      return this.pendingItems.shift()!;
    }
    
    // Fail fast if queue was used but is now empty
    if (this.wasQueued) {
      throw new Error(
        `Choice queue exhausted. You queued items but didn't queue enough for all pick() calls. ` +
        `Either queue more items in your test setup, or check if your code calls pick() more times than expected.`
      );
    }
    
    // Fail fast if registry requires deterministic mode but no items queued
    if (this.registry?.isDeterministic?.()) {
      const choiceName = this.name || 'unnamed';
      const queueHint = this.name ? `model.${this.name}.queue(...)` : 'choice.queue(...)';
      
      throw new Error(
        `Choice "${choiceName}" was accessed in deterministic mode but no items were queued.\n` +
        `Fix: Call ${queueHint} to provide deterministic values for testing.\n` +
        `This ensures your tests are not flaky and produce predictable results.`
      );
    }
    
    // Default random behavior
    const index = Math.floor(Math.random() * this.items.length);
    return this.items[index]!;
  }

  /**
   * Queue specific items to be returned by subsequent pick() calls
   * 
   * Items are returned in the order they are queued (FIFO).
   * Once items are queued, the Choice will fail-fast if the queue is exhausted.
   * 
   * @param items - Items to queue for future pick() calls
   * 
   * @example
   * ```typescript
   * const choice = new Choice(['a', 'b', 'c']);
   * choice.queue('b', 'a', 'c');
   * 
   * choice.pick(); // Returns 'b'
   * choice.pick(); // Returns 'a' 
   * choice.pick(); // Returns 'c'
   * choice.pick(); // Throws error - queue exhausted
   * ```
   */
  queue(...items: T[]): void {
    this.pendingItems.push(...items);
    this.wasQueued = true;
  }

  /**
   * Queue items that match one or more predicates
   * 
   * For each predicate provided:
   * - Filters the original items array to find matches
   * - Queues ALL matching items (not just the first match)
   * - Throws error if predicate matches no items (fail-fast)
   * 
   * This is useful for queuing complex objects by properties or conditions.
   * 
   * @param predicates - One or more functions that test each item
   * @returns Total number of items queued across all predicates
   * @throws Error if any predicate matches no items
   * 
   * @example
   * ```typescript
   * interface Template {
   *   id: string;
   *   pattern: string;
   *   weight: number;
   * }
   * 
   * const templates = new Choice([
   *   { id: 'comparative', pattern: 'More than...', weight: 10 },
   *   { id: 'surreal', pattern: 'The {noun} dreams...', weight: 9 },
   *   { id: 'poetic', pattern: 'In the garden...', weight: 8 }
   * ]);
   * 
   * // Queue by ID (most common)
   * templates.queueWhere(t => t.id === 'comparative');
   * 
   * // Queue by property
   * templates.queueWhere(t => t.weight > 8); // Queues 'comparative' and 'surreal'
   * 
   * // Queue by pattern matching
   * templates.queueWhere(t => t.pattern.includes('noun'));
   * 
   * // Multiple predicates
   * templates.queueWhere(
   *   t => t.id === 'comparative',
   *   t => t.id === 'poetic'
   * );
   * 
   * // This would throw an error - no matches
   * templates.queueWhere(t => t.id === 'nonexistent'); // Error!
   * ```
   */
  queueWhere(...predicates: Array<(item: T) => boolean>): number {
    let totalQueued = 0;
    
    for (const predicate of predicates) {
      const matches = this.items.filter(predicate);
      
      if (matches.length === 0) {
        throw new Error(
          'queueWhere predicate matched no items. Check your predicate logic or ensure the items you\'re looking for exist in the Choice.'
        );
      }
      
      this.queue(...matches);
      totalQueued += matches.length;
    }
    
    return totalQueued;
  }

  /**
   * Clear the queue and reset to random behavior
   * 
   * Useful for test cleanup, though typically each test creates a new Choice instance.
   */
  clearQueue(): void {
    this.pendingItems = [];
    this.wasQueued = false;
  }

  /**
   * Check if there are queued items remaining
   * 
   * Useful for debugging test setups or verifying queue state.
   */
  hasQueuedItems(): boolean {
    return this.pendingItems.length > 0;
  }

  /**
   * Get the number of queued items remaining
   * 
   * Useful for debugging or test assertions.
   */
  queueLength(): number {
    return this.pendingItems.length;
  }
}