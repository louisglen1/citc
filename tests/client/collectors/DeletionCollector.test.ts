/**
 * Tests for DeletionCollector
 * Verifies that Backspace/Delete are captured as 'deletion' events
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeletionCollector } from '../../../src/client/collectors/DeletionCollector';
import { createTestInput } from '../../helpers';
import type { RawEvent } from '../../../src/schemas/events';

describe('DeletionCollector', () => {
  let input: HTMLInputElement;
  let events: RawEvent[];

  beforeEach(() => {
    input = createTestInput({ id: 'test-input', dataField: 'answer' });
    document.body.appendChild(input);
    events = [];
  });

  describe('start', () => {
    it('should emit deletion event for Backspace', () => {
      const collector = new DeletionCollector(input, 'answer', (event) => {
        events.push(event);
      });

      collector.start();

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace' }));

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('deletion');
      expect(events[0].data?.key).toBe('Backspace');
    });

    it('should emit deletion event for Delete', () => {
      const collector = new DeletionCollector(input, 'answer', (event) => {
        events.push(event);
      });

      collector.start();

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete' }));

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('deletion');
      expect(events[0].data?.key).toBe('Delete');
    });

    it('should not emit for regular character keys', () => {
      const collector = new DeletionCollector(input, 'answer', (event) => {
        events.push(event);
      });

      collector.start();

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(events).toHaveLength(0);
    });

    it('should include modifier keys in event data', () => {
      const collector = new DeletionCollector(input, 'answer', (event) => {
        events.push(event);
      });

      collector.start();

      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Backspace',
        ctrlKey: true,
        shiftKey: false,
        altKey: false,
        metaKey: false,
      }));

      expect(events[0].data?.ctrlKey).toBe(true);
      expect(events[0].data?.shiftKey).toBe(false);
    });

    it('should include fieldId and timestamp', () => {
      const collector = new DeletionCollector(input, 'answer-field', (event) => {
        events.push(event);
      });

      collector.start();

      const before = Date.now();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
      const after = Date.now();

      expect(events[0].fieldId).toBe('answer-field');
      expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(events[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('stop', () => {
    it('should remove event listener', () => {
      const collector = new DeletionCollector(input, 'answer', (event) => {
        events.push(event);
      });

      collector.start();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));
      expect(events).toHaveLength(1);

      collector.stop();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

      expect(events).toHaveLength(1);
    });
  });
});
