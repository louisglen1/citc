/**
 * Tests for CaretCollector
 * Verifies caret position tracking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CaretCollector } from '../../../src/client/collectors/CaretCollector';
import { createTestInput } from '../../helpers';
import type { RawEvent } from '../../../src/schemas/events';

describe('CaretCollector', () => {
  let input: HTMLInputElement;
  let events: RawEvent[];
  
  beforeEach(() => {
    input = createTestInput({ id: 'test-input', dataField: 'email', type: 'text' });
    document.body.appendChild(input);
    events = [];
  });
  
  describe('start', () => {
    it('should capture caret position on click', () => {
      const collector = new CaretCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.value = 'test';
      input.setSelectionRange(2, 2);
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('caret');
      expect(events[0].data?.start).toBe(2);
      expect(events[0].data?.end).toBe(2);
    });
    
    it('should capture caret position on keyup', () => {
      const collector = new CaretCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.value = 'hello';
      input.setSelectionRange(3, 3);
      input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      
      expect(events).toHaveLength(1);
      expect(events[0].data?.start).toBe(3);
      expect(events[0].data?.end).toBe(3);
    });
    
    it('should capture selection range', () => {
      const collector = new CaretCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.value = 'testing';
      input.setSelectionRange(1, 5); // Select "esti"
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      expect(events[0].data?.start).toBe(1);
      expect(events[0].data?.end).toBe(5);
    });
    
    it('should capture selectionchange on document', () => {
      const collector = new CaretCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      // Simulate active element
      input.focus();
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });
      
      input.value = 'test';
      input.setSelectionRange(1, 1);
      
      document.dispatchEvent(new Event('selectionchange'));
      
      expect(events.length).toBeGreaterThan(0);
      expect(events[events.length - 1].type).toBe('caret');
    });
    
    it('should not emit when different element is active', () => {
      const collector = new CaretCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const otherInput = document.createElement('input');
      document.body.appendChild(otherInput);
      
      Object.defineProperty(document, 'activeElement', {
        value: otherInput,
        writable: true,
        configurable: true,
      });
      
      input.setSelectionRange(1, 1);
      document.dispatchEvent(new Event('selectionchange'));
      
      expect(events).toHaveLength(0);
    });
    
    it('should include fieldId in event', () => {
      const collector = new CaretCollector(input, 'email-field', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.value = 'test';
      input.setSelectionRange(1, 1);
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      expect(events[0].fieldId).toBe('email-field');
    });
    
    it('should include timestamp in event', () => {
      const collector = new CaretCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const before = Date.now();
      input.setSelectionRange(0, 0);
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const after = Date.now();
      
      expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(events[0].timestamp).toBeLessThanOrEqual(after);
    });
    
    it('should work with textarea elements', () => {
      const textarea = document.createElement('textarea');
      textarea.setAttribute('data-field', 'comment');
      document.body.appendChild(textarea);
      
      const textareaEvents: RawEvent[] = [];
      const collector = new CaretCollector(textarea, 'comment', (event) => {
        textareaEvents.push(event);
      });
      
      collector.start();
      
      textarea.value = 'multiline\ntext';
      textarea.setSelectionRange(5, 5);
      textarea.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      expect(textareaEvents).toHaveLength(1);
      expect(textareaEvents[0].data?.start).toBe(5);
    });
  });
  
  describe('stop', () => {
    it('should remove event listeners', () => {
      const collector = new CaretCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      input.setSelectionRange(0, 0);
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(events).toHaveLength(1);
      
      collector.stop();
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      expect(events).toHaveLength(1); // No new events
    });
    
    it('should remove document listener', () => {
      const collector = new CaretCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      Object.defineProperty(document, 'activeElement', {
        value: input,
        writable: true,
        configurable: true,
      });
      
      collector.stop();
      
      input.setSelectionRange(1, 1);
      document.dispatchEvent(new Event('selectionchange'));
      
      expect(events).toHaveLength(0);
    });
  });
});
