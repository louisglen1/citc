/**
 * Tests for EventProcessor
 * Verifies event processing, context enrichment, and validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventProcessor } from '../../src/client/processors';
import { createTestRawEvent, createTestContext } from '../helpers';

describe('EventProcessor', () => {
  describe('constructor', () => {
    it('should generate a sessionId by default', () => {
      const processor = new EventProcessor();
      const event = processor.process(createTestRawEvent());
      
      expect(event.context.sessionId).toBeDefined();
      expect(typeof event.context.sessionId).toBe('string');
      expect(String(event.context.sessionId).length).toBeGreaterThan(0);
    });
    
    it('should accept initial context', () => {
      const processor = new EventProcessor({ userId: 'user-123', metadata: { page: '/home' } });
      const event = processor.process(createTestRawEvent());
      
      expect(event.context.userId).toBe('user-123');
      expect((event.context.metadata as any)?.page).toBe('/home');
      expect(event.context.sessionId).toBeDefined();
    });
    
    it('should not override sessionId if provided in initial context', () => {
      const processor = new EventProcessor({ sessionId: 'custom-session' });
      const event = processor.process(createTestRawEvent());
      
      expect(event.context.sessionId).toBe('custom-session');
    });
  });
  
  describe('setContext', () => {
    it('should update context with new values', () => {
      const processor = new EventProcessor();
      
      processor.setContext({ userId: 'user-456' });
      const event1 = processor.process(createTestRawEvent());
      expect(event1.context.userId).toBe('user-456');
      
      processor.setContext({ metadata: { page: '/about' } });
      const event2 = processor.process(createTestRawEvent());
      expect(event2.context.userId).toBe('user-456');
      expect((event2.context.metadata as any)?.page).toBe('/about');
    });
    
    it('should merge context instead of replacing', () => {
      const processor = new EventProcessor({ userId: 'user-123', metadata: { page: '/home' } });
      
      processor.setContext({ metadata: { page: '/about' } });
      const event = processor.process(createTestRawEvent());
      
      expect(event.context.userId).toBe('user-123');
      expect((event.context.metadata as any)?.page).toBe('/about');
    });
    
    it('should reject circular references', () => {
      const processor = new EventProcessor();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const circular: any = { a: 1 };
      circular.self = circular;
      
      processor.setContext(circular);
      const event = processor.process(createTestRawEvent());
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid context'),
        expect.any(Error)
      );
      expect(event.context.a).toBeUndefined();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('process', () => {
    let processor: EventProcessor;
    
    beforeEach(() => {
      processor = new EventProcessor({ userId: 'user-123', metadata: { page: '/test' } });
    });
    
    it('should process raw event into telemetry event', () => {
      const raw = createTestRawEvent({
        type: 'keystroke',
        data: { key: 'a', code: 'KeyA' },
      });
      
      const result = processor.process(raw);
      
      expect(result.type).toBe('keystroke');
      expect(result.fieldId).toBe('test-field');
      expect(result.timestamp).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.data).toEqual({ key: 'a', code: 'KeyA' });
    });
    
    it('should attach current context to event', () => {
      const raw = createTestRawEvent();
      const result = processor.process(raw);
      
      expect(result.context.userId).toBe('user-123');
      expect((result.context.metadata as any)?.page).toBe('/test');
      expect(result.context.sessionId).toBeDefined();
    });
    
    it('should use provided timestamp if present', () => {
      const timestamp = Date.now() - 5000;
      const raw = createTestRawEvent({ timestamp });
      
      const result = processor.process(raw);
      
      expect(result.timestamp).toBe(timestamp);
    });
    
    it('should generate timestamp if not provided', () => {
      const before = Date.now();
      const raw = createTestRawEvent();
      delete raw.timestamp;
      
      const result = processor.process(raw);
      const after = Date.now();
      
      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
    });
    
    it('should use empty object for data if not provided', () => {
      const raw = createTestRawEvent();
      delete raw.data;
      
      const result = processor.process(raw);
      
      expect(result.data).toEqual({});
    });
    
    it('should create a shallow copy of context', () => {
      const raw = createTestRawEvent();
      const result = processor.process(raw);
      
      // Modify context after processing
      processor.setContext({ userId: 'user-456' });
      
      // Original event should be unchanged
      expect(result.context.userId).toBe('user-123');
    });
    
    it('should handle all event types', () => {
      const types = ['focus', 'blur', 'keystroke', 'caret', 'selection', 'clipboard'] as const;
      
      types.forEach(type => {
        const raw = createTestRawEvent({ type });
        const result = processor.process(raw);
        
        expect(result.type).toBe(type);
      });
    });
  });
  
  describe('sessionId generation', () => {
    it('should generate unique session IDs', () => {
      const processor1 = new EventProcessor();
      const processor2 = new EventProcessor();
      
      const event1 = processor1.process(createTestRawEvent());
      const event2 = processor2.process(createTestRawEvent());
      
      expect(event1.context.sessionId).not.toBe(event2.context.sessionId);
    });
    
    it('should generate session ID in expected format', () => {
      const processor = new EventProcessor();
      const event = processor.process(createTestRawEvent());
      
      const sessionId = event.context.sessionId as string;
      
      // Should contain timestamp and random part separated by dash
      expect(sessionId).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });
});
