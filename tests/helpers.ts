/**
 * Test helpers and utilities for creating fixtures and mocks
 */

import { vi } from 'vitest';
import type { TelemetryEvent, RawEvent } from '../src/schemas/events';
import type { Context } from '../src/schemas/context';
import type { Transport } from '../src/client/transport';
import type { QueueOptions } from '../src/schemas/config';

/**
 * Create a minimal TelemetryEvent for testing
 */
export function createTestEvent(overrides?: Partial<TelemetryEvent>): TelemetryEvent {
  return {
    type: 'keystroke',
    fieldId: 'test-field',
    timestamp: Date.now(),
    data: { key: 'a' },
    context: {},
    ...overrides,
  };
}

/**
 * Create a minimal RawEvent for testing
 */
export function createTestRawEvent(overrides?: Partial<RawEvent>): RawEvent {
  return {
    type: 'keystroke',
    fieldId: 'test-field',
    target: document.createElement('input'),
    data: { key: 'a' },
    ...overrides,
  };
}

/**
 * Create a test context
 */
export function createTestContext(overrides?: Partial<Context>): Context {
  return {
    sessionId: 'test-session-123',
    userId: 'test-user-456',
    ...overrides,
  };
}

/**
 * Create a mock transport
 */
export function createMockTransport(): Transport {
  return {
    send: vi.fn(async () => {}),
  };
}

/**
 * Create a failing mock transport
 */
export function createFailingTransport(): Transport {
  return {
    send: vi.fn(async () => {
      throw new Error('Transport failed');
    }),
  };
}

/**
 * Create test queue options
 */
export function createTestQueueOptions(overrides?: Partial<QueueOptions>): QueueOptions {
  return {
    batchSize: 10,
    flushInterval: 5000,
    maxQueueSize: 100,
    ...overrides,
  };
}

/**
 * Create a DOM element with data attributes for field discovery
 */
export function createTestInput(options?: {
  id?: string;
  name?: string;
  type?: string;
  dataField?: string;
  value?: string;
}): HTMLInputElement {
  const input = document.createElement('input');
  if (options?.id) input.id = options.id;
  if (options?.name) input.name = options.name;
  if (options?.type) input.type = options.type;
  if (options?.dataField) input.setAttribute('data-field', options.dataField);
  if (options?.value) input.value = options.value;
  return input;
}

/**
 * Create a test form with multiple fields
 */
export function createTestForm(fieldNames: string[]): HTMLFormElement {
  const form = document.createElement('form');
  form.id = 'test-form';
  
  fieldNames.forEach((name, index) => {
    const input = createTestInput({
      id: `field-${index}`,
      name,
      type: 'text',
      dataField: name,
    });
    form.appendChild(input);
  });
  
  return form;
}

/**
 * Create a contenteditable element for caret testing
 */
export function createTestContentEditable(content: string = ''): HTMLDivElement {
  const div = document.createElement('div');
  div.contentEditable = 'true';
  div.textContent = content;
  div.setAttribute('data-field', 'editor');
  return div;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 1000, interval = 50 } = options;
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timeout');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Advance timers and wait for promises
 */
export async function advanceTimersAndFlush(ms: number): Promise<void> {
  vi.advanceTimersByTime(ms);
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Create a spy that tracks calls with cloned arguments
 * Useful for testing mutations
 */
export function createCloningSpy<T extends (...args: any[]) => any>() {
  const calls: any[][] = [];
  const spy = vi.fn((...args: any[]) => {
    // Deep clone arguments to capture their state at call time
    calls.push(args.map(arg => {
      try {
        return structuredClone(arg);
      } catch {
        return arg;
      }
    }));
  });
  
  return {
    spy,
    getCallArgs: (callIndex: number) => calls[callIndex] || [],
  };
}

/**
 * Assertion helper for checking if an object is deeply equal
 */
export function expectDeepEqual<T>(actual: T, expected: T): void {
  const actualStr = JSON.stringify(actual, null, 2);
  const expectedStr = JSON.stringify(expected, null, 2);
  
  if (actualStr !== expectedStr) {
    throw new Error(`Objects not deeply equal:\nActual:\n${actualStr}\n\nExpected:\n${expectedStr}`);
  }
}

/**
 * Mock the Selection API for testing caret and selection collectors
 */
export function mockSelection(options: {
  anchorNode?: Node | null;
  anchorOffset?: number;
  focusNode?: Node | null;
  focusOffset?: number;
  isCollapsed?: boolean;
} = {}) {
  const selection = {
    anchorNode: options.anchorNode || null,
    anchorOffset: options.anchorOffset || 0,
    focusNode: options.focusNode || null,
    focusOffset: options.focusOffset || 0,
    isCollapsed: options.isCollapsed ?? true,
    rangeCount: 1,
    getRangeAt: vi.fn(() => ({
      startContainer: options.anchorNode || null,
      startOffset: options.anchorOffset || 0,
      endContainer: options.focusNode || null,
      endOffset: options.focusOffset || 0,
    })),
    toString: vi.fn(() => ''),
  };
  
  window.getSelection = vi.fn(() => selection as any);
  return selection;
}

/**
 * Restore original Selection API
 */
export function restoreSelection() {
  delete (window as any).getSelection;
}
