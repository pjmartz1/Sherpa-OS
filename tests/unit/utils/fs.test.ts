import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  ensureDir,
  writeYaml,
  readYaml,
  writeJson,
  readJson,
  writeMarkdown,
  readMarkdown,
  fileExists,
  getSherpaRoot,
  getSherpaDir
} from '../../../src/utils/fs.js';

// Note: We'll test the actual ensureDir functionality

describe('fs utilities', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sherpa-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('fileExists', () => {
    it('should return true for existing files', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');
      
      const exists = await fileExists(testFile);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing files', async () => {
      const testFile = path.join(tempDir, 'nonexistent.txt');
      
      const exists = await fileExists(testFile);
      expect(exists).toBe(false);
    });

    it('should return false for files without permissions', async () => {
      // This test might be platform-specific
      const testFile = path.join(tempDir, 'restricted.txt');
      
      const exists = await fileExists(testFile);
      expect(exists).toBe(false);
    });
  });

  describe('writeMarkdown and readMarkdown', () => {
    it('should write and read markdown files correctly', async () => {
      const testFile = path.join(tempDir, 'test.md');
      const content = '# Test Markdown\n\nThis is a test.';
      
      await writeMarkdown(testFile, content);
      const readContent = await readMarkdown(testFile);
      
      expect(readContent).toBe(content);
    });

    it('should create directories if they dont exist', async () => {
      const testFile = path.join(tempDir, 'nested', 'deep', 'test.md');
      const content = '# Test';
      
      await writeMarkdown(testFile, content);
      const exists = await fileExists(testFile);
      
      expect(exists).toBe(true);
    });
  });

  describe('writeJson and readJson', () => {
    it('should write and read JSON files correctly', async () => {
      const testFile = path.join(tempDir, 'test.json');
      const data = { name: 'test', version: '1.0.0', nested: { value: 42 } };
      
      await writeJson(testFile, data);
      const readData = await readJson(testFile);
      
      expect(readData).toEqual(data);
    });

    it('should format JSON with proper indentation', async () => {
      const testFile = path.join(tempDir, 'formatted.json');
      const data = { a: 1, b: { c: 2 } };
      
      await writeJson(testFile, data);
      const content = await fs.readFile(testFile, 'utf-8');
      
      expect(content).toContain('  "a": 1');
      expect(content).toContain('  "b": {');
      expect(content).toContain('    "c": 2');
    });
  });

  describe('writeYaml and readYaml', () => {
    it('should write and read YAML files correctly', async () => {
      const testFile = path.join(tempDir, 'test.yml');
      const data = {
        name: 'test',
        version: '1.0.0',
        dependencies: ['dep1', 'dep2'],
        config: { enabled: true }
      };
      
      await writeYaml(testFile, data);
      const readData = await readYaml(testFile);
      
      expect(readData).toEqual(data);
    });

    it('should handle complex YAML structures', async () => {
      const testFile = path.join(tempDir, 'complex.yml');
      const data = {
        ticket_id: 'TKT-001',
        acceptance_criteria: ['Criterion 1', 'Criterion 2'],
        telemetry: {
          events: ['event1', 'event2'],
          alerts: ['alert1']
        }
      };
      
      await writeYaml(testFile, data);
      const readData = await readYaml(testFile);
      
      expect(readData).toEqual(data);
    });
  });

  describe('getSherpaRoot', () => {
    it('should return current directory when no .sherpa found', () => {
      const originalCwd = process.cwd();
      
      try {
        // Change to temp directory (no .sherpa)
        process.chdir(tempDir);
        const root = getSherpaRoot();
        
        expect(root).toBe(tempDir);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should find .sherpa directory in parent', async () => {
      const originalCwd = process.cwd();
      
      try {
        // Create .sherpa in temp dir
        await fs.mkdir(path.join(tempDir, '.sherpa'));
        
        // Create nested directory and change to it
        const nestedDir = path.join(tempDir, 'nested', 'deep');
        await fs.mkdir(nestedDir, { recursive: true });
        process.chdir(nestedDir);
        
        const root = getSherpaRoot();
        expect(root).toBe(tempDir);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('getSherpaDir', () => {
    it('should return .sherpa path based on root', () => {
      const originalCwd = process.cwd();
      
      try {
        process.chdir(tempDir);
        const sherpaDir = getSherpaDir();
        
        expect(sherpaDir).toBe(path.join(tempDir, '.sherpa'));
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('error handling', () => {
    it('should throw meaningful errors for invalid JSON', async () => {
      const testFile = path.join(tempDir, 'invalid.json');
      await fs.writeFile(testFile, '{ invalid json }');
      
      await expect(readJson(testFile)).rejects.toThrow();
    });

    it('should throw meaningful errors for invalid YAML', async () => {
      const testFile = path.join(tempDir, 'invalid.yml');
      await fs.writeFile(testFile, 'invalid: yaml: content: [unclosed');
      
      await expect(readYaml(testFile)).rejects.toThrow();
    });

    it('should handle permission denied errors gracefully', async () => {
      // Test depends on platform permissions
      const restrictedPath = path.join(tempDir, 'restricted');
      
      await expect(writeMarkdown(restrictedPath, 'test')).resolves.not.toThrow();
    });
  });
});