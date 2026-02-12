/**
 * Tests for LifecycleManager
 * Verifies auto-flush hooks and lifecycle management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LifecycleManager } from '../../src/client/lifecycle';

describe('LifecycleManager', () => {
  let flushCallback: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    flushCallback = vi.fn();
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  describe('setup', () => {
    it('should start auto-flush timer when enabled', () => {
      const manager = new LifecycleManager(
        { enabled: true, autoFlushIntervalMs: 5000 },
        flushCallback as any
      );
      
      manager.setup();
      
      expect(flushCallback).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(5000);
      
      expect(flushCallback).toHaveBeenCalledTimes(1);
    });
    
    it('should respect custom autoFlushIntervalMs', () => {
      const manager = new LifecycleManager(
        { enabled: true, autoFlushIntervalMs: 2000 },
        flushCallback as any
      );
      
      manager.setup();
      
      vi.advanceTimersByTime(2000);
      expect(flushCallback).toHaveBeenCalledTimes(1);
      
      vi.advanceTimersByTime(2000);
      expect(flushCallback).toHaveBeenCalledTimes(2);
    });
    
    it('should not start timer when enabled is false', () => {
      const manager = new LifecycleManager(
        { enabled: false },
        flushCallback as any
      );
      
      manager.setup();
      
      vi.advanceTimersByTime(10000);
      
      expect(flushCallback).not.toHaveBeenCalled();
    });
    
    it('should not start timer when autoFlushIntervalMs is 0', () => {
      const manager = new LifecycleManager(
        { enabled: true, autoFlushIntervalMs: 0 },
        flushCallback as any
      );
      
      manager.setup();
      
      vi.advanceTimersByTime(10000);
      
      expect(flushCallback).not.toHaveBeenCalled();
    });
    
    it('should setup beforeunload hook', () => {
      const manager = new LifecycleManager(
        { enabled: true, flushOnBeforeUnload: true },
        flushCallback as any
      );
      
      manager.setup();
      
      window.dispatchEvent(new Event('beforeunload'));
      
      expect(flushCallback).toHaveBeenCalledTimes(1);
    });
    
    it('should setup visibilitychange hook', () => {
      const manager = new LifecycleManager(
        { enabled: true, flushOnVisibilityChange: true },
        flushCallback as any
      );
      
      manager.setup();
      
      // Simulate visibility change to hidden
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      
      document.dispatchEvent(new Event('visibilitychange'));
      
      expect(flushCallback).toHaveBeenCalled();
    });
    
    it('should not flush on visibility visible', () => {
      const manager = new LifecycleManager(
        { enabled: true, flushOnVisibilityChange: true },
        flushCallback as any
      );
      
      manager.setup();
      
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
        configurable: true,
      });
      
      document.dispatchEvent(new Event('visibilitychange'));
      
      expect(flushCallback).not.toHaveBeenCalled();
    });
    
    it('should setup form submit hook', () => {
      const manager = new LifecycleManager(
        { enabled: true, flushOnFormSubmit: true },
        flushCallback as any
      );
      
      manager.setup();
      
      const form = document.createElement('form');
      form.setAttribute('data-citc-submit', 'true');
      document.body.appendChild(form);
      
      form.dispatchEvent(new Event('submit', { bubbles: true }));
      
      expect(flushCallback).toHaveBeenCalledTimes(1);
    });
    
    it('should only flush on forms with data-citc-submit attribute', () => {
      const manager = new LifecycleManager(
        { enabled: true, flushOnFormSubmit: true },
        flushCallback as any
      );
      
      manager.setup();
      
      const form = document.createElement('form');
      document.body.appendChild(form);
      
      form.dispatchEvent(new Event('submit', { bubbles: true }));
      
      expect(flushCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('teardown', () => {
    it('should clear auto-flush timer', () => {
      const manager = new LifecycleManager(
        { enabled: true, autoFlushIntervalMs: 5000 },
        flushCallback as any
      );
      
      manager.setup();
      
      vi.advanceTimersByTime(5000);
      expect(flushCallback).toHaveBeenCalledTimes(1);
      
      manager.teardown();
      
      vi.advanceTimersByTime(5000);
      expect(flushCallback).toHaveBeenCalledTimes(1); // No additional calls
    });
    
    it('should remove beforeunload listener', () => {
      const manager = new LifecycleManager(
        { enabled: true, flushOnBeforeUnload: true },
        flushCallback as any
      );
      
      manager.setup();
      
      window.dispatchEvent(new Event('beforeunload'));
      expect(flushCallback).toHaveBeenCalledTimes(1);
      
      manager.teardown();
      
      window.dispatchEvent(new Event('beforeunload'));
      expect(flushCallback).toHaveBeenCalledTimes(1); // No additional calls
    });
    
    it('should remove visibilitychange listener', () => {
      const manager = new LifecycleManager(
        { enabled: true, flushOnVisibilityChange: true },
        flushCallback as any
      );
      
      manager.setup();
      
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
        configurable: true,
      });
      
      document.dispatchEvent(new Event('visibilitychange'));
      expect(flushCallback).toHaveBeenCalledTimes(1);
      
      manager.teardown();
      
      document.dispatchEvent(new Event('visibilitychange'));
      expect(flushCallback).toHaveBeenCalledTimes(1); // No additional calls
    });
    
    it('should remove form submit listener', () => {
      const manager = new LifecycleManager(
        { enabled: true, flushOnFormSubmit: true },
        flushCallback as any
      );
      
      manager.setup();
      
      const form = document.createElement('form');
      form.setAttribute('data-citc-submit', 'true');
      document.body.appendChild(form);
      
      form.dispatchEvent(new Event('submit', { bubbles: true }));
      expect(flushCallback).toHaveBeenCalledTimes(1);
      
      manager.teardown();
      
      form.dispatchEvent(new Event('submit', { bubbles: true }));
      expect(flushCallback).toHaveBeenCalledTimes(1); // No additional calls
    });
    
    it('should be idempotent', () => {
      const manager = new LifecycleManager(
        { enabled: true, autoFlushIntervalMs: 5000 },
        flushCallback as any
      );
      
      manager.setup();
      manager.teardown();
      manager.teardown(); // Should not throw
      
      vi.advanceTimersByTime(10000);
      
      expect(flushCallback).not.toHaveBeenCalled();
    });
  });
  
  describe('default options', () => {
    it('should use default values when not specified', () => {
      const manager = new LifecycleManager({}, flushCallback as any);
      
      manager.setup();
      
      // Default autoFlushIntervalMs is 5000
      vi.advanceTimersByTime(5000);
      expect(flushCallback).toHaveBeenCalled();
    });
    
    it('should enable lifecycle hooks by default', () => {
      const manager = new LifecycleManager({}, flushCallback as any);
      
      manager.setup();
      
      window.dispatchEvent(new Event('beforeunload'));
      
      expect(flushCallback).toHaveBeenCalled();
    });
  });
});
