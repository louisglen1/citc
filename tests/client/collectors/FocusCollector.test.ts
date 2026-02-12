/**
 * Tests for FocusCollector
 * Verifies focus and blur event capture
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FocusCollector } from '../../../src/client/collectors/FocusCollector';
import { createTestInput } from '../../helpers';
import type { RawEvent } from '../../../src/schemas/events';

describe('FocusCollector', () => {
  let input: HTMLInputElement;
  let events: RawEvent[];
  
  beforeEach(() => {
    input = createTestInput({ id: 'test-input', dataField: 'email' });
    document.body.appendChild(input);
    events = [];
  });
  
  describe('start', () => {
    it('should capture focus events', () => {
      const collector = new FocusCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.dispatchEvent(new FocusEvent('focus'));
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('focus');
    });
    
    it('should capture blur events', () => {
      const collector = new FocusCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.dispatchEvent(new FocusEvent('blur'));
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('blur');
    });
    
    it('should include fieldId in events', () => {
      const collector = new FocusCollector(input, 'username-field', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.dispatchEvent(new FocusEvent('focus'));
      
      expect(events[0].fieldId).toBe('username-field');
    });
    
    it('should include target element in events', () => {
      const collector = new FocusCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.dispatchEvent(new FocusEvent('focus'));
      
      expect(events[0].target).toBe(input);
    });
    
    it('should include timestamp in events', () => {
      const collector = new FocusCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      const before = Date.now();
      input.dispatchEvent(new FocusEvent('focus'));
      const after = Date.now();
      
      expect(events[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(events[0].timestamp).toBeLessThanOrEqual(after);
    });
    
    it('should capture focus-blur sequence', () => {
      const collector = new FocusCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      
      input.dispatchEvent(new FocusEvent('focus'));
      input.dispatchEvent(new FocusEvent('blur'));
      
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('focus');
      expect(events[1].type).toBe('blur');
    });
  });
  
  describe('stop', () => {
    it('should remove event listeners', () => {
      const collector = new FocusCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      input.dispatchEvent(new FocusEvent('focus'));
      expect(events).toHaveLength(1);
      
      collector.stop();
      input.dispatchEvent(new FocusEvent('blur'));
      
      expect(events).toHaveLength(1); // No new events
    });
    
    it('should be idempotent', () => {
      const collector = new FocusCollector(input, 'email', (event) => {
        events.push(event);
      });
      
      collector.start();
      collector.stop();
      collector.stop();
      
      input.dispatchEvent(new FocusEvent('focus'));
      
      expect(events).toHaveLength(0);
    });
  });
});
