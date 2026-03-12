/**
 * Tests for FieldDiscovery
 * Verifies field discovery logic, selector validation, and security
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FieldDiscovery } from '../../src/client/discover';

describe('FieldDiscovery', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  
  describe('constructor', () => {
    it('should use default capture configuration', () => {
      const discovery = new FieldDiscovery();
      
      const input = document.createElement('input');
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const fields = discovery.discover({ mode: 'attribute', attribute: 'data-citc' });
      
      expect(fields[0].capture.focus).toBe(true);
      expect(fields[0].capture.keystroke).toBe(true);
      expect(fields[0].capture.caret).toBe(false);
      expect(fields[0].capture.selection).toBe(false);
      expect(fields[0].capture.clipboard).toBe(false);
    });
    
    it('should accept custom default capture configuration', () => {
      const discovery = new FieldDiscovery({
        focus: false,
        keystroke: true,
        caret: true,
        selection: true,
        clipboard: true,
      });
      
      const input = document.createElement('input');
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const fields = discovery.discover({ mode: 'attribute', attribute: 'data-citc' });
      
      expect(fields[0].capture.focus).toBe(false);
      expect(fields[0].capture.keystroke).toBe(true);
      expect(fields[0].capture.caret).toBe(true);
    });
  });
  
  describe('discover - attribute mode', () => {
    it('should discover fields by data-citc attribute by default', () => {
      const discovery = new FieldDiscovery();
      
      const input1 = document.createElement('input');
      input1.setAttribute('data-citc', 'email');
      const input2 = document.createElement('input');
      input2.setAttribute('data-citc', 'password');
      
      document.body.appendChild(input1);
      document.body.appendChild(input2);
      
      const fields = discovery.discover({ mode: 'attribute', attribute: 'data-citc' });
      
      expect(fields).toHaveLength(2);
      expect(fields[0].id).toBe('email');
      expect(fields[0].element).toBe(input1);
      expect(fields[1].id).toBe('password');
      expect(fields[1].element).toBe(input2);
    });
    
    it('should discover fields by custom attribute', () => {
      const discovery = new FieldDiscovery();
      
      const input = document.createElement('input');
      input.setAttribute('data-field', 'username');
      document.body.appendChild(input);
      
      const fields = discovery.discover({ mode: 'attribute', attribute: 'data-field' });
      
      expect(fields).toHaveLength(1);
      expect(fields[0].id).toBe('username');
    });
    
    it('should return empty array for undefined selection', () => {
      const discovery = new FieldDiscovery();
      
      const fields = discovery.discover(undefined);
      
      expect(fields).toEqual([]);
    });
    
    it('should skip elements without attribute value', () => {
      const discovery = new FieldDiscovery();
      
      const input1 = document.createElement('input');
      input1.setAttribute('data-citc', '');
      const input2 = document.createElement('input');
      input2.setAttribute('data-citc', 'valid');
      
      document.body.appendChild(input1);
      document.body.appendChild(input2);
      
      const fields = discovery.discover({ mode: 'attribute', attribute: 'data-citc' });
      
      expect(fields).toHaveLength(1);
      expect(fields[0].id).toBe('valid');
    });
    
    it('should throw on empty attribute string', () => {
      const discovery = new FieldDiscovery();

      expect(() => discovery.discover({ mode: 'attribute', attribute: '' }))
        .toThrow('Received an empty attribute string');
    });

    it('should throw and log on invalid attribute name', () => {
      const discovery = new FieldDiscovery();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => discovery.discover({ mode: 'attribute', attribute: '123-invalid' }))
        .toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid attribute'));

      consoleSpy.mockRestore();
    });
    
    it('should accept valid attribute names', () => {
      const discovery = new FieldDiscovery();
      
      const validAttributes = [
        'data-citc',
        'data-field',
        '_private',
        'x-custom',
        'field123',
      ];
      
      validAttributes.forEach(attr => {
        const input = document.createElement('input');
        input.setAttribute(attr, 'test');
        document.body.appendChild(input);
        
        const fields = discovery.discover({ mode: 'attribute', attribute: attr });
        expect(fields.length).toBeGreaterThan(0);
        
        document.body.innerHTML = '';
      });
    });
    
    it('should log and rethrow querySelectorAll errors', () => {
      const discovery = new FieldDiscovery();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const originalQuerySelectorAll = document.querySelectorAll;
      document.querySelectorAll = vi.fn(() => {
        throw new Error('Selector error');
      });

      expect(() => discovery.discover({ mode: 'attribute', attribute: 'data-citc' }))
        .toThrow('Selector error');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid attribute'));

      document.querySelectorAll = originalQuerySelectorAll;
      consoleSpy.mockRestore();
    });
    
    it('should apply per-field capture overrides', () => {
      const discovery = new FieldDiscovery({ keystroke: true, caret: false });
      
      const input = document.createElement('input');
      input.setAttribute('data-citc', 'email');
      document.body.appendChild(input);
      
      const fields = discovery.discover({
        mode: 'attribute',
        attribute: 'data-citc',
        capture: { keystroke: false, caret: true },
      });
      
      expect(fields[0].capture.keystroke).toBe(false);
      expect(fields[0].capture.caret).toBe(true);
    });
  });
  
  describe('discover - explicit mode', () => {
    it('should discover fields by explicit selectors', () => {
      const discovery = new FieldDiscovery();
      
      const input = document.createElement('input');
      input.id = 'email-input';
      document.body.appendChild(input);
      
      const fields = discovery.discover([
        { id: 'email', selector: '#email-input' },
      ]);
      
      expect(fields).toHaveLength(1);
      expect(fields[0].id).toBe('email');
      expect(fields[0].element).toBe(input);
    });
    
    it('should support complex selectors', () => {
      const discovery = new FieldDiscovery();
      
      const form = document.createElement('form');
      form.className = 'login-form';
      const input = document.createElement('input');
      input.name = 'username';
      form.appendChild(input);
      document.body.appendChild(form);
      
      const fields = discovery.discover([
        { id: 'username', selector: '.login-form input[name="username"]' },
      ]);
      
      expect(fields).toHaveLength(1);
      expect(fields[0].element).toBe(input);
    });
    
    it('should throw and log on invalid selector', () => {
      const discovery = new FieldDiscovery();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => discovery.discover([
        { id: 'field1', selector: '[invalid][[[' },
      ])).toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid selector'));

      consoleSpy.mockRestore();
    });

    it('should throw on empty field selector', () => {
      const discovery = new FieldDiscovery();

      expect(() => discovery.discover([
        { id: 'field1', selector: '' },
      ])).toThrow('Received an empty field selector');
    });
    
    it('should skip fields where element is not found', () => {
      const discovery = new FieldDiscovery();
      
      const fields = discovery.discover([
        { id: 'nonexistent', selector: '#does-not-exist' },
      ]);
      
      expect(fields).toHaveLength(0);
    });
    
    it('should apply per-field capture configuration', () => {
      const discovery = new FieldDiscovery();
      
      const input1 = document.createElement('input');
      input1.id = 'field1';
      const input2 = document.createElement('input');
      input2.id = 'field2';
      
      document.body.appendChild(input1);
      document.body.appendChild(input2);
      
      const fields = discovery.discover([
        { id: 'f1', selector: '#field1', capture: { keystroke: true, caret: false } },
        { id: 'f2', selector: '#field2', capture: { keystroke: false, caret: true } },
      ]);
      
      expect(fields[0].capture.keystroke).toBe(true);
      expect(fields[0].capture.caret).toBe(false);
      expect(fields[1].capture.keystroke).toBe(false);
      expect(fields[1].capture.caret).toBe(true);
    });
    
    it('should handle multiple fields with same selector', () => {
      const discovery = new FieldDiscovery();
      
      const input = document.createElement('input');
      input.id = 'shared';
      document.body.appendChild(input);
      
      const fields = discovery.discover([
        { id: 'alias1', selector: '#shared' },
        { id: 'alias2', selector: '#shared' },
      ]);
      
      expect(fields).toHaveLength(2);
      expect(fields[0].element).toBe(input);
      expect(fields[1].element).toBe(input);
      expect(fields[0].id).toBe('alias1');
      expect(fields[1].id).toBe('alias2');
    });
    
    it('should return empty array for empty field list', () => {
      const discovery = new FieldDiscovery();
      
      const fields = discovery.discover([]);
      
      expect(fields).toEqual([]);
    });
  });
  
  describe('capture configuration merging', () => {
    it('should use defaults when no override provided', () => {
      const discovery = new FieldDiscovery({
        focus: true,
        keystroke: false,
        caret: true,
      });
      
      const input = document.createElement('input');
      input.id = 'test';
      document.body.appendChild(input);
      
      const fields = discovery.discover([
        { id: 'test', selector: '#test' },
      ]);
      
      expect(fields[0].capture.focus).toBe(true);
      expect(fields[0].capture.keystroke).toBe(false);
      expect(fields[0].capture.caret).toBe(true);
    });
    
    it('should merge partial overrides with defaults', () => {
      const discovery = new FieldDiscovery({
        focus: true,
        keystroke: true,
        caret: false,
      });
      
      const input = document.createElement('input');
      input.id = 'test';
      document.body.appendChild(input);
      
      const fields = discovery.discover([
        { id: 'test', selector: '#test', capture: { keystroke: false } },
      ]);
      
      // Override applied
      expect(fields[0].capture.keystroke).toBe(false);
      // Defaults preserved
      expect(fields[0].capture.focus).toBe(true);
      expect(fields[0].capture.caret).toBe(false);
    });
  });
});
