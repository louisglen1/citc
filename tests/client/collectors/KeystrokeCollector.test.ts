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
    
    it('should handle special keys', () => {
      const collector = new KeystrokeCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const specialKeys = ['Enter', 'Tab', 'Escape', 'Backspace', 'Delete', 'ArrowUp'];
      
      specialKeys.forEach(key => {
        input.dispatchEvent(new KeyboardEvent('keydown', { key }));
      });
      
      expect(events).toHaveLength(specialKeys.length);
      specialKeys.forEach((key, index) => {
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
