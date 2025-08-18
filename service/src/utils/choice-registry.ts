/**
 * ChoiceRegistry - Centralized Management for Deterministic Testing
 * 
 * This registry manages a group of Choice instances and can enforce deterministic
 * behavior for testing. When in deterministic mode, ALL choices in the registry
 * must be explicitly queued - any attempt to pick() without queueing will fail.
 * 
 * PROBLEM SOLVED:
 * - Prevents accidentally missing queued items in tests
 * - Ensures complete test determinism across all Choice instances
 * - Auto-detects test environments and enables strict mode
 * - Catches non-deterministic behavior immediately with clear error messages
 * 
 * USAGE:
 * ```typescript
 * class MyModel {
 *   readonly choices = new ChoiceRegistry();
 *   
 *   readonly colors = this.choices.create('colors', ['red', 'blue', 'green']);
 *   readonly numbers = this.choices.create('numbers', [1, 2, 3, 4, 5]);
 * }
 * 
 * // In tests (auto-enabled):
 * const model = new MyModel();
 * // model.choices is automatically deterministic in test env
 * 
 * model.colors.queue('red');  // Must queue all choices
 * model.numbers.queue(42);    // Or get: Choice "colors" was accessed...
 * 
 * // In production:
 * const model = new MyModel();
 * // model.choices uses normal random behavior
 * ```
 */

import { Choice } from './choice.js';

interface ChoiceRegistryOptions {
  deterministic?: boolean;
}

export class ChoiceRegistry {
  private deterministicMode = false;
  private choices = new Set<Choice<any>>();
  
  constructor(options: ChoiceRegistryOptions = {}) {
    if (options.deterministic !== undefined) {
      this.deterministicMode = options.deterministic;
    } else {
      // Auto-detect test environment and enable deterministic mode
      if (this.isTestEnvironment()) {
        this.deterministic();
      }
    }
  }
  
  /**
   * Enable deterministic mode - all choices must be queued
   * 
   * Once enabled, any Choice.pick() call without queued items will throw an error.
   * This prevents accidental non-deterministic behavior in tests.
   */
  deterministic(): void {
    this.deterministicMode = true;
  }
  
  
  /**
   * Create a new Choice instance managed by this registry
   * 
   * @param name - Name for debugging (used in error messages)
   * @param items - Array of items for the choice to select from
   * @returns A Choice instance that respects this registry's deterministic mode
   */
  create<T>(name: string, items: T[]): Choice<T> {
    const choice = new Choice(items, this, name);
    this.choices.add(choice);
    return choice;
  }
  
  /**
   * Check if registry is in deterministic mode
   */
  isDeterministic(): boolean {
    return this.deterministicMode;
  }
  
  /**
   * Detect if we're running in a test environment
   * 
   * Checks for common test environment indicators:
   * - NODE_ENV=test
   * - Vitest globals
   * - Jest globals
   * - Other common test runner indicators
   */
  private isTestEnvironment(): boolean {
    // Check NODE_ENV
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return true;
    }
    
    // Check for Vitest
    if (typeof globalThis !== 'undefined' && (
      'vitest' in globalThis || 
      'vi' in globalThis ||
      '__vitest_worker__' in globalThis
    )) {
      return true;
    }
    
    // Check for Jest
    if (typeof globalThis !== 'undefined' && (
      'jest' in globalThis ||
      '__jest__' in globalThis ||
      'jasmine' in globalThis
    )) {
      return true;
    }
    
    // Check if describe/it/test functions exist (common in test runners)
    if (typeof globalThis !== 'undefined' && (
      'describe' in globalThis ||
      'it' in globalThis ||
      'test' in globalThis
    )) {
      return true;
    }
    
    return false;
  }
}