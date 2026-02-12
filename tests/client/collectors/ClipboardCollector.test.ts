/**
 * Tests for ClipboardCollector
 * Verifies clipboard event capture
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ClipboardCollector } from '../../../src/client/collectors/ClipboardCollector';
import { createTestInput } from '../../helpers';
import type { RawEvent } from '../../../src/schemas/events';

describe('ClipboardCollector', () => {
  let input: HTMLInputElement;
  let events: RawEvent[];
  
  beforeEach(() => {
    input = createTestInput({ id: 'test-input', dataField: 'email', type: 'text' });
    document.body.appendChild(input);
    events = [];
  });
  
  describe('start', () => {
    it('should capture paste events', () => {
      const collector = new ClipboardCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
      });
      
      input.dispatchEvent(pasteEvent);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('clipboard');
    });
    
    it('should capture pasted content', () => {
      const collector = new ClipboardCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text', 'pasted text');
      
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
      });
      
      input.dispatchEvent(pasteEvent);
      
      expect(events[0].data?.content).toBe('pasted text');
    });
    
    it('should handle empty clipboard data', () => {
      const collector = new ClipboardCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
      });
      
      input.dispatchEvent(pasteEvent);
      
      expect(events[0].data?.content).toBe('');
    });
    
    it('should handle null clipboard data', () => {
      const collector = new ClipboardCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      // Create event without clipboardData
      const pasteEvent = new Event('paste', { bubbles: true });
      
      input.dispatchEvent(pasteEvent);
      
      expect(events[0].data?.content).toBe('');
    });
    
    it('should include fieldId in event', () => {
      const collector = new ClipboardCollector(input, 'password-field', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text', 'test');
      
      input.dispatchEvent(new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
      }));
      
      expect(events[0].fieldId).toBe('password-field');
    });
    
    it('should include timestamp in event', () => {
      const collector = new ClipboardCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const before = Date.now();
      input.dispatchEvent(new ClipboardEvent('paste'));
      const after = Date.now();
      
      expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(events[0].timestamp).toBeLessThanOrEqual(after);
    });
    
    it('should capture multiple paste events', () => {
      const collector = new ClipboardCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const texts = ['first', 'second', 'third'];
      
      texts.forEach(text => {
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text', text);
        input.dispatchEvent(new ClipboardEvent('paste', {
          clipboardData: dataTransfer,
        }));
      });
      
      expect(events).toHaveLength(3);
      expect(events.map(e => e.data?.content)).toEqual(texts);
    });
  });
  
  describe('stop', () => {
    it('should remove event listener', () => {
      const collector = new ClipboardCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      input.dispatchEvent(new ClipboardEvent('paste'));
      expect(events).toHaveLength(1);
      
      collector.stop();
      input.dispatchEvent(new ClipboardEvent('paste'));
      
      expect(events).toHaveLength(1); // No new events
    });
    
    it('should be idempotent', () => {
      const collector = new ClipboardCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      collector.stop();
      collector.stop();
      
      input.dispatchEvent(new ClipboardEvent('paste'));
      
      expect(events).toHaveLength(0);
    });
  });
});
