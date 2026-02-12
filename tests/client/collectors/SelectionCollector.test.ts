/**
 * Tests for SelectionCollector
 * Verifies text selection event capture
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SelectionCollector } from '../../../src/client/collectors/SelectionCollector';
import { createTestInput } from '../../helpers';
import type { RawEvent } from '../../../src/schemas/events';

describe('SelectionCollector', () => {
  let input: HTMLInputElement;
  let events: RawEvent[];
  
  beforeEach(() => {
    input = createTestInput({ id: 'test-input', dataField: 'email', type: 'text' });
    document.body.appendChild(input);
    events = [];
  });
  
  describe('start', () => {
    it('should capture select events', () => {
      const collector = new SelectionCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.value = 'test@example.com';
      input.setSelectionRange(0, 4); // Select "test"
      input.dispatchEvent(new Event('select', { bubbles: true }));
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('selection');
    });
    
    it('should capture selection start position', () => {
      const collector = new SelectionCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.value = 'hello world';
      input.setSelectionRange(6, 11); // Select "world"
      input.dispatchEvent(new Event('select', { bubbles: true }));
      
      expect(events[0].data?.start).toBe(6);
    });
    
    it('should capture selection end position', () => {
      const collector = new SelectionCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.value = 'hello world';
      input.setSelectionRange(6, 11);
      input.dispatchEvent(new Event('select', { bubbles: true }));
      
      expect(events[0].data?.end).toBe(11);
    });
    
    it('should capture selected text', () => {
      const collector = new SelectionCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.value = 'hello world';
      input.setSelectionRange(0, 5); // Select "hello"
      input.dispatchEvent(new Event('select', { bubbles: true }));
      
      expect(events[0].data?.text).toBe('hello');
    });
    
    it('should handle empty selection', () => {
      const collector = new SelectionCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.value = 'test';
      input.setSelectionRange(2, 2); // Cursor at position 2, no selection
      input.dispatchEvent(new Event('select', { bubbles: true }));
      
      expect(events[0].data?.start).toBe(2);
      expect(events[0].data?.end).toBe(2);
      expect(events[0].data?.text).toBe('');
    });
    
    it('should include fieldId in event', () => {
      const collector = new SelectionCollector(input, 'email-field', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.value = 'test';
      input.setSelectionRange(0, 4);
      input.dispatchEvent(new Event('select', { bubbles: true }));
      
      expect(events[0].fieldId).toBe('email-field');
    });
    
    it('should include timestamp in event', () => {
      const collector = new SelectionCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const before = Date.now();
      input.value = 'test';
      input.setSelectionRange(0, 4);
      input.dispatchEvent(new Event('select', { bubbles: true }));
      const after = Date.now();
      
      expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(events[0].timestamp).toBeLessThanOrEqual(after);
    });
    
    it('should work with textarea elements', () => {
      const textarea = document.createElement('textarea');
      textarea.setAttribute('data-field', 'comment');
      document.body.appendChild(textarea);
      
      const textareaEvents: RawEvent[] = [];
      const collector = new SelectionCollector(textarea, 'comment', (event) => {
        textareaEvents.push(event);
      });
      
      collector.start();
      
      textarea.value = 'line one\nline two';
      textarea.setSelectionRange(0, 8); // Select "line one"
      textarea.dispatchEvent(new Event('select', { bubbles: true }));
      
      expect(textareaEvents).toHaveLength(1);
      expect(textareaEvents[0].data?.text).toBe('line one');
    });
  });
  
  describe('stop', () => {
    it('should remove event listener', () => {
      const collector = new SelectionCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      input.value = 'test';
      input.setSelectionRange(0, 4);
      input.dispatchEvent(new Event('select', { bubbles: true }));
      expect(events).toHaveLength(1);
      
      collector.stop();
      input.dispatchEvent(new Event('select', { bubbles: true }));
      
      expect(events).toHaveLength(1); // No new events
    });
  });
});
