/**
 * Tests for Queue class
 * Verifies event buffering, batching, and flush behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Queue } from '../../src/core/queue';
import { createTestEvent, createMockTransport, createFailingTransport } from '../helpers';

describe('Queue', () => {
  describe('constructor', () => {
    it('should create a queue with default options', () => {
      const transport = createMockTransport();
      const queue = new Queue(transport);
      
      expect(queue).toBeDefined();
    });
    
    it('should create a queue with custom options', () => {
      const transport = createMockTransport();
      const queue = new Queue(transport, {
        batchSize: 5,
        flushInterval: 1000,
        maxQueueSize: 50,
      });
      
      expect(queue).toBeDefined();
    });
    
    it('should throw error for invalid batchSize', () => {
      const transport = createMockTransport();
      
      expect(() => new Queue(transport, { batchSize: 0 })).toThrow('batchSize must be >= 1');
      expect(() => new Queue(transport, { batchSize: -1 })).toThrow('batchSize must be >= 1');
      expect(() => new Queue(transport, { batchSize: Infinity })).toThrow('batchSize must be >= 1 and finite');
      expect(() => new Queue(transport, { batchSize: NaN })).toThrow('batchSize must be >= 1 and finite');
    });
    
    it('should throw error for invalid flushInterval', () => {
      const transport = createMockTransport();
      
      expect(() => new Queue(transport, { flushInterval: -1 })).toThrow('flushInterval must be >= 0');
      expect(() => new Queue(transport, { flushInterval: Infinity })).toThrow('flushInterval must be >= 0 and finite');
    });
    
    it('should throw error for invalid maxQueueSize', () => {
      const transport = createMockTransport();
      
      expect(() => new Queue(transport, { maxQueueSize: 0 })).toThrow('maxQueueSize must be >= 1');
      expect(() => new Queue(transport, { maxQueueSize: -5 })).toThrow('maxQueueSize must be >= 1');
    });
  });
  
  describe('enqueue', () => {
    it('should add event to queue and verify buffer contents', () => {
      const transport = createMockTransport();
      const queue = new Queue(transport, { batchSize: 10 });
      const event1 = createTestEvent({ type: 'keystroke', data: { key: 'a' } });
      const event2 = createTestEvent({ type: 'focus', data: { hasFocus: true } });
      
      queue.enqueue(event1);
      queue.enqueue(event2);
      
      // Queue should not have flushed yet (batch size not reached)
      expect(transport.send).not.toHaveBeenCalled();
      
      // Verify buffer actually contains events in correct order
      const buffer = (queue as any).buffer;
      expect(buffer).toHaveLength(2);
      expect(buffer[0]).toMatchObject({ type: 'keystroke', data: { key: 'a' } });
      expect(buffer[1]).toMatchObject({ type: 'focus', data: { hasFocus: true } });
    });
    
    it('should auto-flush when batch size is reached', async () => {
      const transport = createMockTransport();
      const queue = new Queue(transport, { batchSize: 3 });
      
      queue.enqueue(createTestEvent({ data: { key: 'a' } }));
      queue.enqueue(createTestEvent({ data: { key: 'b' } }));
      
      expect(transport.send).not.toHaveBeenCalled();
      
      queue.enqueue(createTestEvent({ data: { key: 'c' } }));
      
      // Should flush immediately
      await vi.waitFor(() => {
        expect(transport.send).toHaveBeenCalledTimes(1);
      });
    });
    
    it('should enforce maxQueueSize by dropping OLDEST events (FIFO)', () => {
      const transport = createMockTransport();
      const queue = new Queue(transport, { 
        batchSize: 100, 
        maxQueueSize: 3 
      });
      
      const event1 = createTestEvent({ type: 'keystroke', data: { key: '1' } });
      const event2 = createTestEvent({ type: 'keystroke', data: { key: '2' } });
      const event3 = createTestEvent({ type: 'keystroke', data: { key: '3' } });
      const event4 = createTestEvent({ type: 'keystroke', data: { key: '4' } });
      
      queue.enqueue(event1);
      queue.enqueue(event2);
      queue.enqueue(event3);
      
      // Verify buffer is full
      const bufferBefore = (queue as any).buffer;
      expect(bufferBefore).toHaveLength(3);
      
      // This should drop event1 (oldest)
      queue.enqueue(event4);
      
      expect(transport.send).not.toHaveBeenCalled();
      
      // Verify FIFO: oldest (event1) dropped, newest (event4) added
      const bufferAfter = (queue as any).buffer;
      expect(bufferAfter).toHaveLength(3);
      expect(bufferAfter[0].data.key).toBe('2'); // event1 dropped
      expect(bufferAfter[1].data.key).toBe('3');
      expect(bufferAfter[2].data.key).toBe('4'); // event4 added
      
      expect(queue.getDroppedCount()).toBe(1);
    });
    
    it('should handle multiple overflows correctly', () => {
      const transport = createMockTransport();
      const queue = new Queue(transport, { 
        batchSize: 100, 
        maxQueueSize: 2 
      });
      
      for (let i = 1; i <= 5; i++) {
        queue.enqueue(createTestEvent({ data: { key: `${i}` } }));
      }
      
      // Should have dropped events 1, 2, 3 (keeping 4, 5)
      expect(queue.getDroppedCount()).toBe(3);
      
      const buffer = (queue as any).buffer;
      expect(buffer).toHaveLength(2);
      expect(buffer[0].data.key).toBe('4');
      expect(buffer[1].data.key).toBe('5');
    });
  });
  
  describe('flush', () => {
    it('should send all queued events with exact payload structure and order', async () => {
      const transport = createMockTransport();
      const queue = new Queue(transport, { batchSize: 10 });
      
      const event1 = createTestEvent({ type: 'keystroke', data: { key: 'a', code: 'KeyA' } });
      const event2 = createTestEvent({ type: 'focus', data: { hasFocus: true } });
      
      queue.enqueue(event1);
      queue.enqueue(event2);
      
      await queue.flush();
      
      expect(transport.send).toHaveBeenCalledTimes(1);
      
      // Verify exact payload structure
      const sentBatch = (transport.send as any).mock.calls[0][0];
      expect(sentBatch).toHaveLength(2);
      expect(sentBatch[0]).toMatchObject({ 
        type: 'keystroke', 
        data: { key: 'a', code: 'KeyA' } 
      });
      expect(sentBatch[1]).toMatchObject({ 
        type: 'focus', 
        data: { hasFocus: true } 
      });
      
      // Verify order maintained
      expect(sentBatch[0].type).toBe('keystroke');
      expect(sentBatch[1].type).toBe('focus');
      
      // Verify buffer is empty after flush
      const buffer = (queue as any).buffer;
      expect(buffer).toHaveLength(0);
    });
    
    it('should not send if queue is empty', async () => {
      const transport = createMockTransport();
      const queue = new Queue(transport);
      
      await queue.flush();
      
      expect(transport.send).not.toHaveBeenCalled();
    });
    
    it('should restore events on transport failure', async () => {
      const transport = createFailingTransport();
      const queue = new Queue(transport, { batchSize: 10 });
      
      queue.enqueue(createTestEvent({ data: { key: 'a' } }));
      queue.enqueue(createTestEvent({ data: { key: 'b' } }));
      
      await queue.flush();
      
      expect(transport.send).toHaveBeenCalledTimes(1);
      
      // Events should be restored, so flushing again should retry
      await queue.flush();
      
      expect(transport.send).toHaveBeenCalledTimes(2);
    });
    
    it('should prevent concurrent flushes (mutex lock)', async () => {
      const transport = createMockTransport();
      // Add delay to transport to simulate slow network
      transport.send = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      const queue = new Queue(transport, { batchSize: 10 });
      
      queue.enqueue(createTestEvent({ data: { key: 'a' } }));
      
      // Start two flushes concurrently
      const flush1 = queue.flush();
      const flush2 = queue.flush();
      
      await Promise.all([flush1, flush2]);
      
      // Transport should only be called once due to mutex lock
      expect(transport.send).toHaveBeenCalledTimes(1);
    });
    
    it('should handle queue overflow during transport failure', async () => {
      const transport = createFailingTransport();
      const queue = new Queue(transport, { 
        batchSize: 10, 
        maxQueueSize: 3 
      });
      
      // Fill queue to capacity
      queue.enqueue(createTestEvent({ data: { key: '1' } }));
      queue.enqueue(createTestEvent({ data: { key: '2' } }));
      queue.enqueue(createTestEvent({ data: { key: '3' } }));
      
      // Flush fails, events are restored
      await queue.flush();
      
      // Queue should still have 3 events
      const bufferAfterFail = (queue as any).buffer;
      expect(bufferAfterFail).toHaveLength(3);
      
      // Try to enqueue new event - should drop oldest
      queue.enqueue(createTestEvent({ data: { key: '4' } }));
      
      const bufferAfterOverflow = (queue as any).buffer;
      expect(bufferAfterOverflow).toHaveLength(3);
      expect(bufferAfterOverflow[0].data.key).toBe('2'); // event1 dropped
      expect(bufferAfterOverflow[1].data.key).toBe('3');
      expect(bufferAfterOverflow[2].data.key).toBe('4');
      expect(queue.getDroppedCount()).toBe(1);
    });
  });
  
  describe('getDroppedCount', () => {
    it('should return count of dropped events', () => {
      const transport = createMockTransport();
      const queue = new Queue(transport, { 
        batchSize: 100, 
        maxQueueSize: 3 
      });
      
      queue.enqueue(createTestEvent({ data: { key: '1' } }));
      queue.enqueue(createTestEvent({ data: { key: '2' } }));
      queue.enqueue(createTestEvent({ data: { key: '3' } }));
      
      expect(queue.getDroppedCount()).toBe(0);
      
      // This should drop the first event
      queue.enqueue(createTestEvent({ data: { key: '4' } }));
      
      expect(queue.getDroppedCount()).toBe(1);
    });
  });
});
