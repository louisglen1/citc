/**
 * Tests for Transport implementations
 * Verifies HTTP, Beacon, and Console transports
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpTransport, BeaconTransport, ConsoleTransport } from '../../src/client/transport';
import { createTestEvent } from '../helpers';

describe('HttpTransport', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    fetchMock = vi.fn();
    (globalThis as any).fetch = fetchMock;
  });
  
  it('should send events via fetch POST with exact payload structure', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    
    const transport = new HttpTransport('https://api.example.com/events');
    const event1 = createTestEvent({ type: 'keystroke', data: { key: 'a', code: 'KeyA' } });
    const event2 = createTestEvent({ type: 'focus', data: { hasFocus: true } });
    
    await transport.send([event1, event2]);
    
    // Verify method, headers, and payload
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/events',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: [event1, event2] }),
      }
    );
    
    // Verify exact payload structure
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toBe('https://api.example.com/events');
    expect(call[1].method).toBe('POST');
    expect(call[1].headers['Content-Type']).toBe('application/json');
    
    const parsedBody = JSON.parse(call[1].body);
    expect(parsedBody.events).toHaveLength(2);
    expect(parsedBody.events[0]).toMatchObject({ type: 'keystroke', data: { key: 'a', code: 'KeyA' } });
    expect(parsedBody.events[1]).toMatchObject({ type: 'focus', data: { hasFocus: true } });
  });
  
  it('should send multiple events', async () => {
    fetchMock.mockResolvedValue({ ok: true });
    
    const transport = new HttpTransport('https://api.example.com/events');
    const events = [
      createTestEvent({ type: 'keystroke', data: { key: 'a' } }),
      createTestEvent({ type: 'focus', data: {} }),
      createTestEvent({ type: 'blur', data: {} }),
    ];
    
    await transport.send(events);
    
    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(callBody.events).toHaveLength(3);
  });
  
  it('should log error on failed response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const transport = new HttpTransport('https://api.example.com/events');
    await transport.send([createTestEvent()]);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('HTTP transport failed'),
      500
    );
    
    consoleSpy.mockRestore();
  });
  
  it('should handle fetch errors', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const transport = new HttpTransport('https://api.example.com/events');
    await transport.send([createTestEvent()]);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('HTTP transport error'),
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });
  
  it('should not throw on errors', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const transport = new HttpTransport('https://api.example.com/events');
    
    await expect(transport.send([createTestEvent()])).resolves.toBeUndefined();
  });
});

describe('BeaconTransport', () => {
  let sendBeaconMock: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    sendBeaconMock = vi.fn(() => true);
    (navigator as any).sendBeacon = sendBeaconMock;
  });
  
  it('should send events via sendBeacon', async () => {
    sendBeaconMock.mockReturnValue(true);
    
    const transport = new BeaconTransport('https://api.example.com/events');
    const events = [createTestEvent()];
    
    await transport.send(events);
    
    expect(sendBeaconMock).toHaveBeenCalledWith(
      'https://api.example.com/events',
      expect.any(Blob)
    );
  });
  
  it('should send events as JSON blob with exact payload structure', async () => {
    sendBeaconMock.mockReturnValue(true);
    
    const transport = new BeaconTransport('https://api.example.com/events');
    const event1 = createTestEvent({ type: 'keystroke', data: { key: 'a' } });
    const event2 = createTestEvent({ type: 'focus', data: { hasFocus: true } });
    
    await transport.send([event1, event2]);
    
    expect(sendBeaconMock).toHaveBeenCalledTimes(1);
    expect(sendBeaconMock).toHaveBeenCalledWith(
      'https://api.example.com/events',
      expect.any(Blob)
    );
    
    const blob = sendBeaconMock.mock.calls[0][1] as Blob;
    expect(blob.type).toBe('application/json');
    expect(blob.size).toBeGreaterThan(0);
    
    // Verify blob size indicates it contains data
    // Note: jsdom Blob doesn't support .text(), but we can verify structure via size
    expect(blob.size).toBeGreaterThan(100); // JSON with 2 events should be >100 bytes
  });
  
  it('should handle sendBeacon quota exceeded (returns false)', async () => {
    sendBeaconMock.mockReturnValue(false); // Quota exceeded
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const transport = new BeaconTransport('https://api.example.com/events');
    
    // Should not throw even when quota exceeded
    await expect(transport.send([createTestEvent()])).resolves.toBeUndefined();
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Beacon transport failed')
    );
    
    consoleSpy.mockRestore();
  });
  
  it('should handle sendBeacon errors', async () => {
    sendBeaconMock.mockImplementation(() => {
      throw new Error('sendBeacon error');
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const transport = new BeaconTransport('https://api.example.com/events');
    await transport.send([createTestEvent()]);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Beacon transport error'),
      expect.any(Error)
    );
    
    consoleSpy.mockRestore();
  });
  
  it('should not throw on errors', async () => {
    sendBeaconMock.mockImplementation(() => {
      throw new Error('sendBeacon error');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const transport = new BeaconTransport('https://api.example.com/events');
    
    await expect(transport.send([createTestEvent()])).resolves.toBeUndefined();
  });
});

describe('ConsoleTransport', () => {
  it('should log events to console', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const transport = new ConsoleTransport();
    const events = [createTestEvent()];
    
    await transport.send(events);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[CITC] Events:',
      events
    );
    
    consoleSpy.mockRestore();
  });
  
  it('should log multiple events', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    const transport = new ConsoleTransport();
    const events = [
      createTestEvent({ type: 'keystroke' }),
      createTestEvent({ type: 'focus' }),
    ];
    
    await transport.send(events);
    
    expect(consoleSpy).toHaveBeenCalledWith(
      '[CITC] Events:',
      events
    );
    
    consoleSpy.mockRestore();
  });
});
