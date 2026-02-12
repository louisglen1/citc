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
    it('should add event to queue', () => {
      const transport = createMockTransport();
      const queue = new Queue(transport, { batchSize: 10 });
      const event = createTestEvent();
      
      queue.enqueue(event);
      
      // Queue should not have flushed yet (batch size not reached)
      expect(transport.send).not.toHaveBeenCalled();
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
    
    it('should enforce maxQueueSize by dropping oldest events', () => {
      const transport = createMockTransport();
      const queue = new Queue(transport, { 
        batchSize: 100, 
        maxQueueSize: 3 
      });
      
      queue.enqueue(createTestEvent({ data: { key: '1' } }));
      queue.enqueue(createTestEvent({ data: { key: '2' } }));
      queue.enqueue(createTestEvent({ data: { key: '3' } }));
      
      // This should drop the first event
      queue.enqueue(createTestEvent({ data: { key: '4' } }));
      
      expect(transport.send).not.toHaveBeenCalled();
    });
  });
  
  describe('flush', () => {
    it('should send all queued events', async () => {
      const transport = createMockTransport();
      const queue = new Queue(transport, { batchSize: 10 });
      
      queue.enqueue(createTestEvent({ data: { key: 'a' } }));
      queue.enqueue(createTestEvent({ data: { key: 'b' } }));
      
      await queue.flush();
      
      expect(transport.send).toHaveBeenCalledTimes(1);
      expect(transport.send).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ data: { key: 'a' } }),
          expect.objectContaining({ data: { key: 'b' } }),
        ])
      );
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
