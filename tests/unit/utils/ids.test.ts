import { describe, it, expect, vi } from 'vitest';
import {
  generateTicketId,
  generateEpicId,
  generateStoryId,
  formatDate
} from '../../../src/utils/ids.js';

describe('ids utilities', () => {
  describe('generateTicketId', () => {
    it('should generate unique ticket IDs', () => {
      const id1 = generateTicketId();
      const id2 = generateTicketId();
      
      expect(id1).toMatch(/^TKT-[A-Z0-9]{8}-[A-Z0-9]{5}$/);
      expect(id2).toMatch(/^TKT-[A-Z0-9]{8}-[A-Z0-9]{5}$/);
      expect(id1).not.toBe(id2);
    });

    it('should always start with TKT- prefix', () => {
      const ids = Array.from({ length: 10 }, () => generateTicketId());
      
      ids.forEach(id => {
        expect(id.startsWith('TKT-')).toBe(true);
      });
    });

    it('should have consistent format', () => {
      const id = generateTicketId();
      const parts = id.split('-');
      
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('TKT');
      expect(parts[1]).toHaveLength(8);
      expect(parts[2]).toHaveLength(5);
    });
  });

  describe('generateEpicId', () => {
    it('should generate unique epic IDs', () => {
      const id1 = generateEpicId();
      const id2 = generateEpicId();
      
      expect(id1).toMatch(/^EPC-[A-Z0-9]{8}-[A-Z0-9]{5}$/);
      expect(id2).toMatch(/^EPC-[A-Z0-9]{8}-[A-Z0-9]{5}$/);
      expect(id1).not.toBe(id2);
    });

    it('should always start with EPC- prefix', () => {
      const ids = Array.from({ length: 10 }, () => generateEpicId());
      
      ids.forEach(id => {
        expect(id.startsWith('EPC-')).toBe(true);
      });
    });

    it('should have consistent format', () => {
      const id = generateEpicId();
      const parts = id.split('-');
      
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('EPC');
      expect(parts[1]).toHaveLength(8);
      expect(parts[2]).toHaveLength(5);
    });
  });

  describe('generateStoryId', () => {
    it('should generate unique story IDs', () => {
      const id1 = generateStoryId();
      const id2 = generateStoryId();
      
      expect(id1).toMatch(/^STY-[A-Z0-9]{8}-[A-Z0-9]{5}$/);
      expect(id2).toMatch(/^STY-[A-Z0-9]{8}-[A-Z0-9]{5}$/);
      expect(id1).not.toBe(id2);
    });

    it('should always start with STY- prefix', () => {
      const ids = Array.from({ length: 10 }, () => generateStoryId());
      
      ids.forEach(id => {
        expect(id.startsWith('STY-')).toBe(true);
      });
    });

    it('should have consistent format', () => {
      const id = generateStoryId();
      const parts = id.split('-');
      
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('STY');
      expect(parts[1]).toHaveLength(8);
      expect(parts[2]).toHaveLength(5);
    });
  });

  describe('formatDate', () => {
    it('should format current date by default', () => {
      const formatted = formatDate();
      
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Should be today's date
      const today = new Date();
      const expected = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      
      expect(formatted).toBe(expected);
    });

    it('should format provided date', () => {
      const testDate = new Date('2025-01-25T15:30:00.000Z');
      const formatted = formatDate(testDate);
      
      expect(formatted).toBe('2025-01-25');
    });

    it('should handle different date inputs', () => {
      const dates = [
        new Date('2025-12-31T23:59:59.999Z'),
        new Date('2025-01-01T00:00:00.000Z'),
        new Date('2025-06-15T12:30:45.123Z')
      ];

      const expected = ['2025-12-31', '2025-01-01', '2025-06-15'];

      dates.forEach((date, index) => {
        expect(formatDate(date)).toBe(expected[index]);
      });
    });

    it('should handle edge cases', () => {
      // February 29th (leap year)
      const leapYear = new Date('2024-02-29T12:00:00.000Z');
      expect(formatDate(leapYear)).toBe('2024-02-29');

      // Single digit month and day
      const singleDigits = new Date('2025-01-01T00:00:00.000Z');
      expect(formatDate(singleDigits)).toBe('2025-01-01');
    });

    it('should be consistent across multiple calls', () => {
      // Mock Date to ensure consistency
      const fixedDate = new Date('2025-01-25T10:30:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(fixedDate);

      const result1 = formatDate();
      const result2 = formatDate();
      
      expect(result1).toBe(result2);
      expect(result1).toBe('2025-01-25');

      vi.useRealTimers();
    });
  });

  describe('ID uniqueness and collision resistance', () => {
    it('should generate many unique ticket IDs', () => {
      const ids = new Set();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        ids.add(generateTicketId());
      }

      expect(ids.size).toBe(count);
    });

    it('should generate unique IDs across different types', () => {
      const ticketId = generateTicketId();
      const epicId = generateEpicId();
      const storyId = generateStoryId();

      expect(ticketId).not.toBe(epicId);
      expect(ticketId).not.toBe(storyId);
      expect(epicId).not.toBe(storyId);

      // Should have different prefixes
      expect(ticketId.startsWith('TKT-')).toBe(true);
      expect(epicId.startsWith('EPC-')).toBe(true);
      expect(storyId.startsWith('STY-')).toBe(true);
    });
  });
});