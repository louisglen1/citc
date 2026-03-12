/**
 * Tests for Privacy module
 * Verifies privacy filtering and redaction behavior
 */

import { describe, it, expect } from 'vitest';
import { Privacy } from '../../src/core/privacy';
import { createTestEvent } from '../helpers';

describe('Privacy', () => {
  describe('filter', () => {
    it('should return event unchanged when text redaction is disabled', () => {
      const event = createTestEvent({
        type: 'keystroke',
        data: { key: 'a', code: 'KeyA', content: 'sensitive' },
      });
      
      const privacy = new Privacy({ redactText: false, redactClipboard: false });
      const filtered = privacy.filter(event);
      
      expect(filtered.data.key).toBe('a');
      expect(filtered.data.code).toBe('KeyA');
    });
    
    it('should redact text fields while preserving ALL other fields', () => {
      const event = createTestEvent({
        type: 'keystroke',
        data: { 
          key: 'a', 
          code: 'KeyA',
          ctrlKey: true,
          shiftKey: false,
          altKey: false,
          metaKey: false,
          timestamp: 1234567890
        },
      });
      
      const privacy = new Privacy({ redactText: true });
      const filtered = privacy.filter(event);
      
      // Verify redacted fields
      expect(filtered.data.key).toBeNull();
      expect(filtered.data.code).toBeNull();
      
      // Verify ALL preserved fields are unchanged
      expect(filtered.data.ctrlKey).toBe(true);
      expect(filtered.data.shiftKey).toBe(false);
      expect(filtered.data.altKey).toBe(false);
      expect(filtered.data.metaKey).toBe(false);
      expect(filtered.data.timestamp).toBe(1234567890);
      
      // Verify no new fields were added
      const expectedKeys = ['key', 'code', 'ctrlKey', 'shiftKey', 'altKey', 'metaKey', 'timestamp'];
      expect(Object.keys(filtered.data).sort()).toEqual(expectedKeys.sort());
      
      // Verify deep clone (not reference)
      expect(filtered).not.toBe(event);
      expect(filtered.data).not.toBe(event.data);
    });
    
    it('should not redact non-text fields', () => {
      const event = createTestEvent({
        type: 'focus',
        data: { fieldName: 'email', focused: true },
      });
      
      const privacy = new Privacy({ redactText: true });
      const filtered = privacy.filter(event);
      
      expect(filtered.data.fieldName).toBe('email');
      expect(filtered.data.focused).toBe(true);
    });
    
    it('should redact clipboard content while preserving action field', () => {
      const event = createTestEvent({
        type: 'clipboard',
        data: { 
          content: 'copied text', 
          action: 'copy',
          timestamp: 1234567890,
          targetField: 'email'
        },
      });
      
      const privacy = new Privacy({ redactClipboard: true });
      const filtered = privacy.filter(event);
      
      // Verify redacted field
      expect(filtered.data.content).toBeNull();
      
      // Verify ALL preserved fields
      expect(filtered.data.action).toBe('copy');
      expect(filtered.data.timestamp).toBe(1234567890);
      expect(filtered.data.targetField).toBe('email');
      
      // Verify no new fields added
      const expectedKeys = ['content', 'action', 'timestamp', 'targetField'];
      expect(Object.keys(filtered.data).sort()).toEqual(expectedKeys.sort());
    });
    
    it('should not mutate original event (deep clone)', () => {
      const original = createTestEvent({
        type: 'keystroke',
        data: { 
          key: 'a',
          nested: { deeply: { value: 'secret' } }
        },
      });
      
      const privacy = new Privacy({ redactText: true });
      const filtered = privacy.filter(original);
      
      // Original should be unchanged
      expect(original.data.key).toBe('a');
      expect(original.data.nested).toEqual({ deeply: { value: 'secret' } });
      
      // Filtered should be redacted
      expect(filtered.data.key).toBeNull();
    });
    
    it('should handle nested objects correctly', () => {
      const event = createTestEvent({
        type: 'keystroke',
        data: {
          key: 'a',
          metadata: {
            timestamp: Date.now(),
            user: { id: 123 }
          }
        },
      });
      
      const privacy = new Privacy({ redactText: true });
      const filtered = privacy.filter(event);
      
      expect(filtered.data.key).toBeNull();
      expect(filtered.data.metadata).toEqual(event.data.metadata);
    });
    
    it('should redact selection text while preserving position data', () => {
      const event = createTestEvent({
        type: 'selection',
        data: {
          text: 'selected text',
          start: 0,
          end: 13,
          direction: 'forward',
          fieldId: 'email'
        },
      });
      
      const privacy = new Privacy({ redactText: true });
      const filtered = privacy.filter(event);
      
      // Verify redacted field
      expect(filtered.data.text).toBeNull();
      
      // Verify ALL preserved fields
      expect(filtered.data.start).toBe(0);
      expect(filtered.data.end).toBe(13);
      expect(filtered.data.direction).toBe('forward');
      expect(filtered.data.fieldId).toBe('email');
      
      // Verify no new fields added
      const expectedKeys = ['text', 'start', 'end', 'direction', 'fieldId'];
      expect(Object.keys(filtered.data).sort()).toEqual(expectedKeys.sort());
    });
    
    it('should handle events without text fields', () => {
      const event = createTestEvent({
        type: 'focus',
        data: { fieldName: 'email', focused: true },
      });
      
      const privacy = new Privacy({ redactText: true });
      const filtered = privacy.filter(event);
      
      expect(filtered.data).toEqual(event.data);
    });
    
    it('should apply default redactions', () => {
      const event = createTestEvent({
        type: 'keystroke',
        data: { key: 'a', code: 'KeyA' },
      });
      
      const privacy = new Privacy(); // Uses defaults
      const filtered = privacy.filter(event);
      
      // Should redact by default
      expect(filtered.data.key).toBeNull();
      expect(filtered.data.code).toBeNull();
    });
    it('should redact empty string key values', () => {
      const event = createTestEvent({
        type: 'keystroke',
        data: { key: '', code: '' },
      });
      const privacy = new Privacy({ redactText: true });
      const filtered = privacy.filter(event);
      expect(filtered.data.key).toBeNull();
      expect(filtered.data.code).toBeNull();
    });
  });
});
