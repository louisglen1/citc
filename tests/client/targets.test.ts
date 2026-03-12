/**
 * Tests for TargetManager
 * Verifies collector attachment and lifecycle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TargetManager } from '../../src/client/targets';
import { createTestInput } from '../helpers';
import type { DiscoveredField } from '../../src/client/discover';
import type { RawEvent } from '../../src/schemas/events';

describe('TargetManager', () => {
  let emit: (event: RawEvent) => void;
  let events: RawEvent[];
  
  beforeEach(() => {
    events = [];
    emit = vi.fn((event: RawEvent) => {
      events.push(event);
    });
  });
  
  describe('attach', () => {
    it('should attach focus collector when enabled', () => {
      const manager = new TargetManager(emit);
      const input = createTestInput({ id: 'test', dataField: 'email' });
      document.body.appendChild(input);
      
      const fields: DiscoveredField[] = [{
        id: 'email',
        element: input,
        capture: { focus: true, keystroke: false, caret: false, selection: false, clipboard: false },
      }];
      
      manager.attach(fields);
      
      input.dispatchEvent(new FocusEvent('focus'));
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('focus');
    });
    
    it('should attach keystroke collector when enabled', () => {
      const manager = new TargetManager(emit);
      const input = createTestInput({ id: 'test', dataField: 'email' });
      document.body.appendChild(input);
      
      const fields: DiscoveredField[] = [{
        id: 'email',
        element: input,
        capture: { focus: false, keystroke: true, caret: false, selection: false, clipboard: false },
      }];
      
      manager.attach(fields);
      
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('keystroke');
    });
    
    it('should attach multiple collectors when enabled', () => {
      const manager = new TargetManager(emit);
      const input = createTestInput({ id: 'test', dataField: 'email' });
      document.body.appendChild(input);
      
      const fields: DiscoveredField[] = [{
        id: 'email',
        element: input,
        capture: { focus: true, keystroke: true, caret: false, selection: false, clipboard: false },
      }];
      
      manager.attach(fields);
      
      input.dispatchEvent(new FocusEvent('focus'));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('focus');
      expect(events[1].type).toBe('keystroke');
    });
    
    it('should attach collectors to multiple fields', () => {
      const manager = new TargetManager(emit);
      
      const input1 = createTestInput({ id: 'input1', dataField: 'email' });
      const input2 = createTestInput({ id: 'input2', dataField: 'password' });
      document.body.appendChild(input1);
      document.body.appendChild(input2);
      
      const fields: DiscoveredField[] = [
        {
          id: 'email',
          element: input1,
          capture: { focus: true, keystroke: false, caret: false, selection: false, clipboard: false },
        },
        {
          id: 'password',
          element: input2,
          capture: { focus: true, keystroke: false, caret: false, selection: false, clipboard: false },
        },
      ];
      
      manager.attach(fields);
      
      input1.dispatchEvent(new FocusEvent('focus'));
      input2.dispatchEvent(new FocusEvent('focus'));
      
      expect(events).toHaveLength(2);
      expect(events[0].fieldId).toBe('email');
      expect(events[1].fieldId).toBe('password');
    });
    
    it('should not attach disabled collectors', () => {
      const manager = new TargetManager(emit);
      const input = createTestInput({ id: 'test', dataField: 'email' });
      document.body.appendChild(input);
      
      const fields: DiscoveredField[] = [{
        id: 'email',
        element: input,
        capture: { focus: false, keystroke: false, caret: false, selection: false, clipboard: false },
      }];
      
      manager.attach(fields);
      
      input.dispatchEvent(new FocusEvent('focus'));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      
      expect(events).toHaveLength(0);
    });
    
    it('should start all collectors after attachment', () => {
      const manager = new TargetManager(emit);
      const input = createTestInput({ id: 'test', dataField: 'email' });
      document.body.appendChild(input);
      
      const fields: DiscoveredField[] = [{
        id: 'email',
        element: input,
        capture: { focus: true, keystroke: false, caret: false, selection: false, clipboard: false },
      }];
      
      manager.attach(fields);
      
      // Events should work immediately
      input.dispatchEvent(new FocusEvent('focus'));
      
      expect(events).toHaveLength(1);
    });
  });
  
  describe('detach', () => {
    it('should stop all collectors', () => {
      const manager = new TargetManager(emit);
      const input = createTestInput({ id: 'test', dataField: 'email' });
      document.body.appendChild(input);
      
      const fields: DiscoveredField[] = [{
        id: 'email',
        element: input,
        capture: { focus: true, keystroke: true, caret: false, selection: false, clipboard: false },
      }];
      
      manager.attach(fields);
      
      input.dispatchEvent(new FocusEvent('focus'));
      expect(events).toHaveLength(1);
      
      manager.detach();
      
      input.dispatchEvent(new FocusEvent('blur'));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      
      expect(events).toHaveLength(1); // No new events
    });
    
    it('should clear collectors array', () => {
      const manager = new TargetManager(emit);
      const input = createTestInput({ id: 'test', dataField: 'email' });
      document.body.appendChild(input);
      
      const fields: DiscoveredField[] = [{
        id: 'email',
        element: input,
        capture: { focus: true, keystroke: false, caret: false, selection: false, clipboard: false },
      }];
      
      manager.attach(fields);
      manager.detach();
      
      // Should be able to attach again without issues
      manager.attach(fields);
      
      input.dispatchEvent(new FocusEvent('focus'));
      
      expect(events).toHaveLength(1);
    });
    
    it('should be idempotent', () => {
      const manager = new TargetManager(emit);
      const input = createTestInput({ id: 'test', dataField: 'email' });
      document.body.appendChild(input);
      
      const fields: DiscoveredField[] = [{
        id: 'email',
        element: input,
        capture: { focus: true, keystroke: false, caret: false, selection: false, clipboard: false },
      }];
      
      manager.attach(fields);
      manager.detach();
      manager.detach(); // Should not throw
      
      input.dispatchEvent(new FocusEvent('focus'));
      
      expect(events).toHaveLength(0);
    });
  });
  
  describe('collector types', () => {
    it('should attach caret collector when enabled', () => {
      const manager = new TargetManager(emit);
      const input = createTestInput({ id: 'test', dataField: 'email', type: 'text' });
      document.body.appendChild(input);
      
      const fields: DiscoveredField[] = [{
        id: 'email',
        element: input,
        capture: { focus: false, keystroke: false, caret: true, selection: false, clipboard: false },
      }];
      
      manager.attach(fields);

      input.setSelectionRange(0, 0);
      Object.defineProperty(document, 'activeElement', { value: input, writable: true, configurable: true });
      document.dispatchEvent(new Event('selectionchange'));

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('caret');
    });
    
    it('should attach selection collector when enabled', () => {
      const manager = new TargetManager(emit);
      const input = createTestInput({ id: 'test', dataField: 'email', type: 'text' });
      document.body.appendChild(input);
      
      const fields: DiscoveredField[] = [{
        id: 'email',
        element: input,
        capture: { focus: false, keystroke: false, caret: false, selection: true, clipboard: false },
      }];
      
      manager.attach(fields);
      
      input.value = 'test';
      input.setSelectionRange(0, 4);
      input.dispatchEvent(new Event('select', { bubbles: true }));
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('selection');
    });
    
    it('should attach clipboard collector when enabled', () => {
      const manager = new TargetManager(emit);
      const input = createTestInput({ id: 'test', dataField: 'email' });
      document.body.appendChild(input);
      
      const fields: DiscoveredField[] = [{
        id: 'email',
        element: input,
        capture: { focus: false, keystroke: false, caret: false, selection: false, clipboard: true },
      }];
      
      manager.attach(fields);
      
      input.dispatchEvent(new ClipboardEvent('paste'));
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('clipboard');
    });
  });
});
