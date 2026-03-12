/**
 * Tests for TelemetryEngine
 * Verifies engine lifecycle, field discovery, and event flow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TelemetryEngine } from '../../src/client/engine';
import { createTestInput } from '../helpers';

describe('TelemetryEngine', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  describe('constructor', () => {
    it('should create engine with default options', () => {
      const engine = new TelemetryEngine();
      
      expect(engine).toBeDefined();
    });
    
    it('should create engine with custom context', () => {
      const engine = new TelemetryEngine({
        context: { userId: 'user-123', metadata: { app: 'test-app' } },
      });
      
      expect(engine).toBeDefined();
    });
    
    it('should create console transport when no endpoint provided', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const input = createTestInput({ id: 'test', dataField: 'email' });
      document.body.appendChild(input);
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-field' },
      });
      
      engine.start();
      input.dispatchEvent(new FocusEvent('focus'));
      
      vi.advanceTimersByTime(10000);
      
      expect(consoleSpy).toHaveBeenCalled();
      
      engine.stop();
      consoleSpy.mockRestore();
    });
  });
  
  describe('start', () => {
    it('should discover fields and attach functional collectors', async () => {
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        lifecycle: { enabled: false },
      });
      
      engine.start();
      
      // Trigger keystroke event
      input.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'a', 
        code: 'KeyA',
        bubbles: true 
      }));
      
      // Trigger focus event
      input.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      
      // Flush to verify events were captured
      await engine.flush();
      
      // Verify console transport received events
      const logCalls = consoleSpy.mock.calls.filter(call => 
        call[0] && String(call[0]).includes('[CITC] Events:')
      );
      
      expect(logCalls.length).toBeGreaterThan(0);
      
      // Verify event types
      const events = logCalls[0][1];
      expect(events).toBeInstanceOf(Array);
      expect(events.some((e: any) => e.type === 'keystroke')).toBe(true);
      expect(events.some((e: any) => e.type === 'focus')).toBe(true);
      
      await engine.stop();
      consoleSpy.mockRestore();
    });
    
    it('should be idempotent', () => {
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
      });
      
      engine.start();
      engine.start(); // Should not throw
      engine.start();
      
      engine.stop();
    });
    
    it('should warn when no fields discovered', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-nonexistent' },
      });
      
      engine.start();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No fields discovered'),
        expect.anything()
      );
      
      engine.stop();
      consoleSpy.mockRestore();
    });
    
    it('should setup lifecycle hooks', () => {
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        lifecycle: { enabled: true, autoFlushIntervalMs: 1000 },
      });
      
      engine.start();
      
      // Generate event
      input.dispatchEvent(new FocusEvent('focus'));
      
      // Wait for auto-flush
      vi.advanceTimersByTime(1000);
      
      // Should have flushed (console transport logs)
      expect(consoleSpy).toHaveBeenCalled();
      
      engine.stop();
      consoleSpy.mockRestore();
    });
  });
  
  describe('stop', () => {
    it('should detach collectors', () => {
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
      });
      
      engine.start();
      input.dispatchEvent(new FocusEvent('focus'));
      
      engine.stop();
      
      // After stop, events should not be collected
      consoleSpy.mockClear();
      input.dispatchEvent(new FocusEvent('blur'));
      
      vi.advanceTimersByTime(10000);
      
      // No new events should be logged
      const relevantCalls = consoleSpy.mock.calls.filter(
        call => call[0] && call[0].includes('[CITC] Events:')
      );
      expect(relevantCalls).toHaveLength(0);
      
      consoleSpy.mockRestore();
    });
    
    it('should flush pending events', async () => {
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        lifecycle: { enabled: false }, // Disable auto-flush
      });
      
      engine.start();
      input.dispatchEvent(new FocusEvent('focus'));
      
      // Don't wait for auto-flush, stop immediately
      await engine.stop();
      
      // Should have flushed on stop
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CITC] Events:',
        expect.any(Array)
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should be idempotent', async () => {
      const engine = new TelemetryEngine();
      
      engine.start();
      await engine.stop();
      await engine.stop(); // Should not throw
      await engine.stop();
    });
    
    it('should teardown lifecycle hooks', async () => {
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        lifecycle: { enabled: true, autoFlushIntervalMs: 1000 },
      });
      
      engine.start();
      await engine.stop();
      
      consoleSpy.mockClear();
      
      // Timer should be stopped
      vi.advanceTimersByTime(5000);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('flush', () => {
    it('should manually flush events', async () => {
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        lifecycle: { enabled: false },
      });
      
      engine.start();
      input.dispatchEvent(new FocusEvent('focus'));
      
      await engine.flush();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[CITC] Events:',
        expect.any(Array)
      );
      
      await engine.stop();
      consoleSpy.mockRestore();
    });
  });
  
  describe('setContext', () => {
    it('should update context for future events', async () => {
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        context: { userId: 'user-123' },
      });
      
      engine.start();
      
      engine.setContext({ metadata: { page: '/home' } });
      
      input.dispatchEvent(new FocusEvent('focus'));
      
      await engine.flush();
      
      const logCall = consoleSpy.mock.calls.find(call => 
        call[0] && call[0].includes('[CITC] Events:')
      );
      
      expect(logCall).toBeDefined();
      const events = logCall?.[1];
      expect(events[0].context.userId).toBe('user-123');
      expect(events[0].context.metadata?.page).toBe('/home');
      
      await engine.stop();
      consoleSpy.mockRestore();
    });
  });
  
  describe('privacy', () => {
    it('should apply privacy filters to events', async () => {
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        privacy: { redactText: true },
      });
      
      engine.start();
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA' }));
      
      await engine.flush();
      
      const logCall = consoleSpy.mock.calls.find(call => 
        call[0] && call[0].includes('[CITC] Events:')
      );
      
      const events = logCall?.[1];
      expect(events[0].data.key).toBeNull(); // Redacted
      expect(events[0].data.code).toBeNull(); // Redacted
      
      await engine.stop();
      consoleSpy.mockRestore();
    });
  });
  
  describe('transport selection', () => {
    it('should use Beacon transport by default when endpoint provided', async () => {
      const beaconMock = vi.fn(() => true);
      navigator.sendBeacon = beaconMock;
      
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        endpoint: 'https://api.example.com/events',
        lifecycle: { enabled: false },
      });
      
      engine.start();
      input.dispatchEvent(new FocusEvent('focus'));
      
      await engine.flush();
      
      // Should use sendBeacon (default when available)
      expect(beaconMock).toHaveBeenCalled();
      
      await engine.stop();
    });
    
    it('should use HTTP transport when sendBeacon unavailable', async () => {
      // Remove sendBeacon before creating engine
      const originalSendBeacon = navigator.sendBeacon;
      delete (navigator as any).sendBeacon;
      
      const fetchMock = vi.fn().mockResolvedValue({ ok: true });
      globalThis.fetch = fetchMock;
      
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        endpoint: 'https://api.example.com/events',
        lifecycle: { enabled: false },
      });
      
      engine.start();
      input.dispatchEvent(new FocusEvent('focus'));
      
      await engine.flush();
      
      // Should fall back to fetch
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/events',
        expect.any(Object)
      );
      
      await engine.stop();
      
      // Restore
      (navigator as any).sendBeacon = originalSendBeacon;
    });
  });
  
  describe('observeMutations', () => {
    it('should attach collectors to elements added after start()', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        dom: { observeMutations: true },
        lifecycle: { enabled: false },
      });

      engine.start();

      const input = document.createElement('input');
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);

      // Wait for MutationObserver microtask to fire
      await Promise.resolve();

      input.dispatchEvent(new FocusEvent('focus'));
      await engine.flush();

      const logCall = consoleSpy.mock.calls.find(call =>
        call[0] && call[0].includes('[CITC] Events:')
      );
      expect(logCall).toBeDefined();
      expect(logCall?.[1][0].fieldId).toBe('email');

      await engine.stop();
      consoleSpy.mockRestore();
    });

    it('should discover nested elements within an added container node', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        dom: { observeMutations: true },
        lifecycle: { enabled: false },
      });

      engine.start();

      const container = document.createElement('div');
      const nested = document.createElement('input');
      nested.setAttribute('data-citc', 'nested-field');
      container.appendChild(nested);
      document.body.appendChild(container);

      await Promise.resolve();

      nested.dispatchEvent(new FocusEvent('focus'));
      await engine.flush();

      const logCall = consoleSpy.mock.calls.find(call =>
        call[0] && call[0].includes('[CITC] Events:')
      );
      expect(logCall).toBeDefined();
      expect(logCall?.[1][0].fieldId).toBe('nested-field');

      await engine.stop();
      consoleSpy.mockRestore();
    });

    it('should not attach collectors to dynamic elements when observeMutations is not set', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        lifecycle: { enabled: false },
      });

      engine.start();

      const input = document.createElement('input');
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);

      await Promise.resolve();

      input.dispatchEvent(new FocusEvent('focus'));
      await engine.flush();

      const logCall = consoleSpy.mock.calls.find(call =>
        call[0] && call[0].includes('[CITC] Events:')
      );
      expect(logCall).toBeUndefined();

      await engine.stop();
      consoleSpy.mockRestore();
    });

    it('should stop observing after stop()', async () => {
      const input = createTestInput({ id: 'existing' });
      input.setAttribute('data-citc', 'existing');
      document.body.appendChild(input);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        dom: { observeMutations: true },
        lifecycle: { enabled: false },
      });

      engine.start();
      await engine.stop();

      consoleSpy.mockClear();

      const newInput = document.createElement('input');
      newInput.setAttribute('data-citc', 'new-field');
      document.body.appendChild(newInput);

      await Promise.resolve();

      newInput.dispatchEvent(new FocusEvent('focus'));

      const logCall = consoleSpy.mock.calls.find(call =>
        call[0] && call[0].includes('[CITC] Events:')
      );
      expect(logCall).toBeUndefined();

      consoleSpy.mockRestore();
    });

    it('should be a no-op observer in explicit field mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const engine = new TelemetryEngine({
        fields: [{ id: 'email', selector: '#email-input' }],
        dom: { observeMutations: true },
        lifecycle: { enabled: false },
      });

      engine.start();

      // Add an element that would match the explicit selector
      const input = document.createElement('input');
      input.id = 'email-input';
      document.body.appendChild(input);

      await Promise.resolve();

      input.dispatchEvent(new FocusEvent('focus'));
      await engine.flush();

      // Explicit mode observer is a no-op — element not discovered
      const logCall = consoleSpy.mock.calls.find(call =>
        call[0] && call[0].includes('[CITC] Events:')
      );
      expect(logCall).toBeUndefined();

      await engine.stop();
      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle stop() called during active flush', async () => {
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        lifecycle: { enabled: false },
      });
      
      engine.start();
      input.dispatchEvent(new FocusEvent('focus'));
      
      // Flush and stop should both complete without error
      await engine.flush();
      await engine.stop();
      
      // Verify events were sent
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    it('should handle context with circular references', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
      });
      
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      engine.start();
      
      const circularObj: any = { level1: { level2: {} } };
      circularObj.level1.level2.circular = circularObj;
      
      // Should log error, not crash
      expect(() => engine.setContext(circularObj)).not.toThrow();
      
      // Verify error was logged (might be about circular or JSON stringify)
      expect(consoleSpy).toHaveBeenCalled();
      
      engine.stop();
      consoleSpy.mockRestore();
    });
    
    it('should handle restart scenario (start after stop)', async () => {
      const input = createTestInput({ id: 'test' });
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        lifecycle: { enabled: false },
      });
      
      // First lifecycle
      engine.start();
      input.dispatchEvent(new FocusEvent('focus'));
      await engine.flush();
      
      const firstFlushCalls = consoleSpy.mock.calls.length;
      
      await engine.stop();
      consoleSpy.mockClear();
      
      // Restart
      engine.start();
      input.dispatchEvent(new FocusEvent('blur'));
      await engine.flush();
      
      // Should have captured new event
      expect(consoleSpy).toHaveBeenCalled();
      
      await engine.stop();
      consoleSpy.mockRestore();
    });
    
    it('should handle multiple fields with same capture config', () => {
      const input1 = createTestInput({ id: 'email' });
      input1.setAttribute('data-citc', 'email');
      const input2 = createTestInput({ id: 'password' });
      input2.setAttribute('data-citc', 'password');
      
      document.body.appendChild(input1);
      document.body.appendChild(input2);
      
      const engine = new TelemetryEngine({
        fields: { mode: 'attribute', attribute: 'data-citc' },
        defaults: {
          capture: {
            focus: true,
            keystroke: true,
            caret: false,
            selection: false,
            clipboard: false,
          },
        },
      });
      
      // Should not throw
      expect(() => engine.start()).not.toThrow();
      
      engine.stop();
    });
  });
});
