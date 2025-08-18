import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Choice } from './choice.js';
import { ChoiceRegistry } from './choice-registry.js';

describe('Choice', () => {
  describe('Constructor', () => {
    it('should prevent direct construction', () => {
      expect(() => new Choice(['a', 'b', 'c'])).toThrow(
        'Choice cannot be created directly. Use ChoiceRegistry.create() instead'
      );
    });

    it('should create choice via ChoiceRegistry', () => {
      const registry = new ChoiceRegistry();
      const choice = registry.create('test', ['a', 'b', 'c']);
      expect(choice).toBeInstanceOf(Choice);
    });

    it('should throw error for empty items array via registry', () => {
      const registry = new ChoiceRegistry();
      expect(() => registry.create('test', [])).toThrow('Choice cannot be created with empty items array');
    });
  });

  describe('Random behavior (no queue)', () => {
    let mathRandomSpy: ReturnType<typeof vi.spyOn>;
    let registry: ChoiceRegistry;
    
    beforeEach(() => {
      mathRandomSpy = vi.spyOn(Math, 'random');
      registry = new ChoiceRegistry({ deterministic: false });
    });
    
    afterEach(() => {
      mathRandomSpy.mockRestore();
    });

    it('should pick randomly when no items are queued', () => {
      mathRandomSpy.mockReturnValue(0.5); // Will select middle item
      
      const choice = registry.create('test', ['a', 'b', 'c']);
      const result = choice.pick();
      
      expect(result).toBe('b'); // Middle item at index 1
      expect(mathRandomSpy).toHaveBeenCalled();
    });

    it('should pick first item when random returns 0', () => {
      mathRandomSpy.mockReturnValue(0);
      
      const choice = registry.create('test', ['x', 'y', 'z']);
      const result = choice.pick();
      
      expect(result).toBe('x');
    });

    it('should pick last item when random returns near 1', () => {
      mathRandomSpy.mockReturnValue(0.99);
      
      const choice = registry.create('test', ['x', 'y', 'z']);
      const result = choice.pick();
      
      expect(result).toBe('z');
    });

    it('should handle single item array', () => {
      const choice = registry.create('test', ['only']);
      const result = choice.pick();
      
      expect(result).toBe('only');
    });
  });

  describe('Queue behavior', () => {
    let registry: ChoiceRegistry;
    
    beforeEach(() => {
      registry = new ChoiceRegistry({ deterministic: false });
    });

    it('should return queued items in FIFO order', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      choice.queue('x', 'y', 'z');
      
      expect(choice.pick()).toBe('x');
      expect(choice.pick()).toBe('y');
      expect(choice.pick()).toBe('z');
    });

    it('should handle single queued item', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      choice.queue('special');
      
      expect(choice.pick()).toBe('special');
    });

    it('should allow queuing items multiple times', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      choice.queue('first');
      choice.queue('second', 'third');
      
      expect(choice.pick()).toBe('first');
      expect(choice.pick()).toBe('second');
      expect(choice.pick()).toBe('third');
    });

    it('should work with items not in original array', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      choice.queue('x', 'y'); // Items not in original array
      
      expect(choice.pick()).toBe('x');
      expect(choice.pick()).toBe('y');
    });
  });

  describe('Fail-fast behavior', () => {
    let registry: ChoiceRegistry;
    
    beforeEach(() => {
      registry = new ChoiceRegistry({ deterministic: false });
    });

    it('should throw error when queue is exhausted', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      choice.queue('x', 'y');
      
      // Use up queued items
      choice.pick(); // 'x'
      choice.pick(); // 'y'
      
      // Next pick should fail
      expect(() => choice.pick()).toThrow(
        'Choice queue exhausted. You queued items but didn\'t queue enough for all pick() calls.'
      );
    });

    it('should not fail-fast if queue was never used', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      
      // Should work fine - never used queue, so falls back to random
      const result = choice.pick();
      expect(['a', 'b', 'c']).toContain(result);
    });

    it('should reset to random behavior after clearing queue', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      choice.queue('x');
      choice.pick(); // Use the queue
      choice.clearQueue(); // Clear it
      
      // Should NOT fail after clearQueue resets the wasQueued flag
      const result = choice.pick();
      expect(['a', 'b', 'c']).toContain(result);
    });
  });

  describe('Queue management methods', () => {
    let registry: ChoiceRegistry;
    
    beforeEach(() => {
      registry = new ChoiceRegistry({ deterministic: false });
    });

    it('should report queue status correctly', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      
      expect(choice.hasQueuedItems()).toBe(false);
      expect(choice.queueLength()).toBe(0);
      
      choice.queue('x', 'y');
      
      expect(choice.hasQueuedItems()).toBe(true);
      expect(choice.queueLength()).toBe(2);
      
      choice.pick(); // Remove one item
      
      expect(choice.hasQueuedItems()).toBe(true);
      expect(choice.queueLength()).toBe(1);
      
      choice.pick(); // Remove last item
      
      expect(choice.hasQueuedItems()).toBe(false);
      expect(choice.queueLength()).toBe(0);
    });

    it('should clear queue and reset fail-fast flag', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      choice.queue('x');
      choice.pick(); // Use queue
      
      choice.clearQueue();
      
      expect(choice.hasQueuedItems()).toBe(false);
      expect(choice.queueLength()).toBe(0);
      
      // Should not fail-fast after clearQueue resets the flag
      const result = choice.pick();
      expect(['a', 'b', 'c']).toContain(result);
    });
  });

  describe('Mixed usage patterns', () => {
    let registry: ChoiceRegistry;
    
    beforeEach(() => {
      registry = new ChoiceRegistry({ deterministic: false });
    });

    it('should handle queue followed by random', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      choice.queue('queued');
      
      // First pick uses queue
      expect(choice.pick()).toBe('queued');
      
      // Second pick should fail (queue exhausted)
      expect(() => choice.pick()).toThrow('Choice queue exhausted');
    });

    it('should handle multiple queue operations', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      
      choice.queue('first');
      expect(choice.pick()).toBe('first');
      
      // Queue more after exhaustion should reset behavior
      choice.clearQueue();
      choice.queue('second');
      expect(choice.pick()).toBe('second');
    });
  });

  describe('Type safety', () => {
    let registry: ChoiceRegistry;
    
    beforeEach(() => {
      registry = new ChoiceRegistry({ deterministic: false });
    });

    it('should work with string arrays', () => {
      const choice = registry.create('test', ['hello', 'world']);
      choice.queue('test');
      
      const result: string = choice.pick();
      expect(result).toBe('test');
    });

    it('should work with number arrays', () => {
      const choice = registry.create('test', [1, 2, 3]);
      choice.queue(42);
      
      const result: number = choice.pick();
      expect(result).toBe(42);
    });

    it('should work with object arrays', () => {
      interface Item {
        name: string;
        value: number;
      }
      
      const items: Item[] = [
        { name: 'a', value: 1 },
        { name: 'b', value: 2 }
      ];
      
      const choice = registry.create('test', items);
      const testItem = { name: 'test', value: 99 };
      choice.queue(testItem);
      
      const result: Item = choice.pick();
      expect(result).toBe(testItem);
    });
  });

  describe('queueWhere predicate matching', () => {
    let registry: ChoiceRegistry;
    
    beforeEach(() => {
      registry = new ChoiceRegistry({ deterministic: false });
    });

    interface TestItem {
      id: string;
      value: number;
      category: string;
    }

    const testItems: TestItem[] = [
      { id: 'first', value: 10, category: 'high' },
      { id: 'second', value: 5, category: 'low' },
      { id: 'third', value: 15, category: 'high' },
      { id: 'fourth', value: 3, category: 'low' }
    ];

    it('should queue items matching predicate', () => {
      const choice = registry.create('test', testItems);
      
      choice.queueWhere(item => item.category === 'high');
      
      const first = choice.pick();
      const second = choice.pick();
      
      expect([first.id, second.id]).toEqual(['first', 'third']);
    });

    it('should queue items matching multiple predicates', () => {
      const choice = registry.create('test', testItems);
      
      const count = choice.queueWhere(
        item => item.id === 'second',
        item => item.value > 10
      );
      
      expect(count).toBe(2); // 'second' + 'third'
      expect(choice.pick().id).toBe('second');
      expect(choice.pick().id).toBe('third');
    });

    it('should throw error if predicate matches no items', () => {
      const choice = registry.create('test', testItems);
      
      expect(() => {
        choice.queueWhere(item => item.category === 'nonexistent');
      }).toThrow('queueWhere predicate matched no items');
    });

    it('should work with simple string arrays', () => {
      const choice = registry.create('test', ['apple', 'banana', 'cherry', 'apricot']);
      
      choice.queueWhere(item => item.startsWith('a'));
      
      expect(choice.pick()).toBe('apple');
      expect(choice.pick()).toBe('apricot');
    });

    it('should queue all matches when multiple items match', () => {
      const choice = registry.create('test', testItems);
      
      choice.queueWhere(item => item.value < 10);
      
      expect(choice.queueLength()).toBe(2); // 'second' and 'fourth'
      expect(choice.pick().value).toBeLessThan(10);
      expect(choice.pick().value).toBeLessThan(10);
    });

    it('should return correct count of queued items', () => {
      const choice = registry.create('test', testItems);
      
      const count = choice.queueWhere(item => item.category === 'high');
      
      expect(count).toBe(2);
      expect(choice.queueLength()).toBe(2);
    });

    it('should work with complex predicates', () => {
      const choice = registry.create('test', testItems);
      
      choice.queueWhere(item => 
        item.category === 'high' && item.value > 12
      );
      
      expect(choice.pick().id).toBe('third');
      expect(() => choice.pick()).toThrow('Choice queue exhausted');
    });
  });

  describe('Edge cases', () => {
    let registry: ChoiceRegistry;
    
    beforeEach(() => {
      registry = new ChoiceRegistry({ deterministic: false });
    });

    it('should handle queue with duplicate items', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      choice.queue('same', 'same', 'same');
      
      expect(choice.pick()).toBe('same');
      expect(choice.pick()).toBe('same');
      expect(choice.pick()).toBe('same');
    });

    it('should handle empty queue calls', () => {
      const choice = registry.create('test', ['a', 'b', 'c']);
      choice.queue(); // Empty queue call
      
      expect(choice.hasQueuedItems()).toBe(false);
      
      // Should still fail-fast because queue was "used" (even if empty)
      expect(() => choice.pick()).toThrow('Choice queue exhausted');
    });
  });
});