/**
 * Global test setup file
 * Runs before all test files to configure the test environment
 */

import { afterEach, beforeEach, vi } from 'vitest';

/**
 * Setup jsdom environment before each test
 */
beforeEach(() => {
  // Reset document to clean state
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  
  // Mock common browser APIs that might not be in jsdom
  if (!window.navigator.sendBeacon) {
    window.navigator.sendBeacon = vi.fn(() => true);
  }
  
  // Mock localStorage if needed
  if (!window.localStorage) {
    const storage: Record<string, string> = {};
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => storage[key] || null,
        setItem: (key: string, value: string) => { storage[key] = value; },
        removeItem: (key: string) => { delete storage[key]; },
        clear: () => { Object.keys(storage).forEach(key => delete storage[key]); },
        get length() { return Object.keys(storage).length; },
        key: (index: number) => Object.keys(storage)[index] || null,
      },
      writable: true,
    });
  }
  
  // Mock performance.now if needed
  if (!window.performance.now) {
    window.performance.now = vi.fn(() => Date.now());
  }
});

/**
 * Cleanup after each test
 */
afterEach(() => {
  // Clear all timers
  vi.clearAllTimers();
  
  // Clear all mocks
  vi.clearAllMocks();
  
  // Restore all mocks
  vi.restoreAllMocks();
  
  // Clean up document
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

/**
 * Global test utilities
 */
export const testUtils = {
  /**
   * Wait for next tick
   */
  nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  /**
   * Wait for specified milliseconds
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Trigger a DOM event on an element
   */
  triggerEvent: (element: Element, eventType: string, eventInit?: EventInit) => {
    const event = new Event(eventType, { bubbles: true, cancelable: true, ...eventInit });
    element.dispatchEvent(event);
  },
  
  /**
   * Trigger a keyboard event on an element
   */
  triggerKeyboardEvent: (
    element: Element,
    eventType: 'keydown' | 'keyup' | 'keypress',
    key: string,
    options?: Partial<KeyboardEventInit>
  ) => {
    const event = new KeyboardEvent(eventType, {
      key,
      code: key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    element.dispatchEvent(event);
  },
  
  /**
   * Trigger a mouse event on an element
   */
  triggerMouseEvent: (
    element: Element,
    eventType: string,
    options?: Partial<MouseEventInit>
  ) => {
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      ...options,
    });
    element.dispatchEvent(event);
  },
};
