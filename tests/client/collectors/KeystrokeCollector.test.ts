/**
 * Tests for KeystrokeCollector
 * Verifies keystroke event capture and data extraction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeystrokeCollector } from '../../../src/client/collectors/KeystrokeCollector';
import { createTestInput } from '../../helpers';
import type { RawEvent } from '../../../src/schemas/events';

describe('KeystrokeCollector', () => {
  let input: HTMLInputElement;
  let events: RawEvent[];
  
  beforeEach(() => {
    input = createTestInput({ id: 'test-input', dataField: 'email' });
    document.body.appendChild(input);
    events = [];
  });
  
  describe('start', () => {
    it('should capture keydown events', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' });
      input.dispatchEvent(keyEvent);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('keystroke');
    });
    
    it('should capture key property', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' }));
      
      expect(events[0].data?.key).toBe('a');
    });
    
    it('should capture code property', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' }));
      
      expect(events[0].data?.code).toBe('KeyA');
    });
    
    it('should capture modifier keys', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        shiftKey: true,
        altKey: false,
        metaKey: false,
      }));
      
      expect(events[0].data?.ctrlKey).toBe(true);
      expect(events[0].data?.shiftKey).toBe(true);
      expect(events[0].data?.altKey).toBe(false);
      expect(events[0].data?.metaKey).toBe(false);
    });
    
    it('should handle special keys as keystroke events', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });

      collector.start();

      // Backspace and Delete are emitted as 'deletion' events, not 'keystroke'
      const specialKeys = ['Enter', 'Tab', 'Escape', 'ArrowUp'];

      specialKeys.forEach(key => {
        input.dispatchEvent(new KeyboardEvent('keydown', { key }));
      });

      expect(events).toHaveLength(specialKeys.length);
      specialKeys.forEach((key, index) => {
        expect(events[index].type).toBe('keystroke');
        expect(events[index].data?.key).toBe(key);
      });
    });
    
    it('should include fieldId in event', () => {
      const collector = new KeystrokeCollector(input, 'email-field', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      
      expect(events[0].fieldId).toBe('email-field');
    });
    
    it('should include target element in event', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      
      expect(events[0].target).toBe(input);
    });
    
    it('should include timestamp in event', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const before = Date.now();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      const after = Date.now();
      
      expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(events[0].timestamp).toBeLessThanOrEqual(after);
    });
    
    it('should capture multiple keystrokes', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      'hello'.split('').forEach(char => {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: char }));
      });
      
      expect(events).toHaveLength(5);
      expect(events.map(e => e.data?.key).join('')).toBe('hello');
    });
  });
  
  describe('deletion events', () => {
    it('should emit deletion event instead of keystroke for Backspace', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });

      collector.start();
      input.value = 'hello';
      input.setSelectionRange(3, 3);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('deletion');
    });

    it('should emit deletion event instead of keystroke for Delete', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });

      collector.start();
      input.value = 'hello';
      input.setSelectionRange(2, 2);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('deletion');
    });

    it('should capture deletion range and text for Backspace', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });

      collector.start();
      input.value = 'hello';
      input.setSelectionRange(3, 3); // cursor after 'hel'
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

      expect(events[0].data?.start).toBe(2);
      expect(events[0].data?.end).toBe(3);
      expect(events[0].data?.count).toBe(1);
      expect(events[0].data?.text).toBe('l');
    });

    it('should capture deletion range and text for Delete', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });

      collector.start();
      input.value = 'hello';
      input.setSelectionRange(2, 2); // cursor before 'l'
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));

      expect(events[0].data?.start).toBe(2);
      expect(events[0].data?.end).toBe(3);
      expect(events[0].data?.count).toBe(1);
      expect(events[0].data?.text).toBe('l');
    });

    it('should capture selected range deletion', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });

      collector.start();
      input.value = 'hello world';
      input.setSelectionRange(1, 4); // 'ell' selected
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

      expect(events[0].data?.start).toBe(1);
      expect(events[0].data?.end).toBe(4);
      expect(events[0].data?.count).toBe(3);
      expect(events[0].data?.text).toBe('ell');
    });

    it('should report boundary (count 0) for Backspace at start of field', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });

      collector.start();
      input.value = 'hello';
      input.setSelectionRange(0, 0);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

      expect(events[0].data?.start).toBe(0);
      expect(events[0].data?.end).toBe(0);
      expect(events[0].data?.count).toBe(0);
      expect(events[0].data?.text).toBe('');
    });

    it('should report boundary (count 0) for Delete at end of field', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });

      collector.start();
      input.value = 'hello';
      input.setSelectionRange(5, 5);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));

      expect(events[0].data?.start).toBe(5);
      expect(events[0].data?.end).toBe(5);
      expect(events[0].data?.count).toBe(0);
      expect(events[0].data?.text).toBe('');
    });

    it('should report null range for Ctrl+Backspace (word deletion)', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });

      collector.start();
      input.value = 'hello world';
      input.setSelectionRange(5, 5);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', ctrlKey: true }));

      expect(events[0].data?.start).toBeNull();
      expect(events[0].data?.end).toBeNull();
      expect(events[0].data?.count).toBeNull();
      expect(events[0].data?.text).toBeNull();
    });

    it('should preserve modifier keys in deletion event', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });

      collector.start();
      input.value = 'hello';
      input.setSelectionRange(3, 3);
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Backspace',
        shiftKey: true,
        altKey: false,
        metaKey: false,
        ctrlKey: false,
      }));

      expect(events[0].data?.key).toBe('Backspace');
      expect(events[0].data?.shiftKey).toBe(true);
      expect(events[0].data?.altKey).toBe(false);
      expect(events[0].data?.metaKey).toBe(false);
      expect(events[0].data?.ctrlKey).toBe(false);
    });

    it('should include fieldId and target in deletion event', () => {
      const collector = new KeystrokeCollector(input, 'my-field', (event) => {
        events.push(event);
      });

      collector.start();
      input.value = 'a';
      input.setSelectionRange(1, 1);
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

      expect(events[0].fieldId).toBe('my-field');
      expect(events[0].target).toBe(input);
    });
  });

  describe('stop', () => {
    it('should remove event listener', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      expect(events).toHaveLength(1);
      
      collector.stop();
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
      
      expect(events).toHaveLength(1); // No new events
    });
    
    it('should be idempotent', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      collector.stop();
      collector.stop();
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      
      expect(events).toHaveLength(0);
    });
  });
});
