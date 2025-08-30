import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock os module
vi.mock('os', async () => {
  const actual = await vi.importActual('os');
  return {
    ...actual,
    homedir: vi.fn()
  };
});
import {
  getGlobalSherpaDir,
  hasGlobalSetup,
  getGlobalConfig,
  updateGlobalConfig,
  incrementProjectCount,
  getGlobalStandardsPath,
  loadGlobalStandards,
  showGlobalSetupPrompt
} from '../../../src/utils/global-config.js';

describe('global-config utilities', () => {
  let tempHomeDir: string;
  let originalHome: string;

  beforeEach(async () => {
    // Create temp directory to simulate home directory
    tempHomeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sherpa-home-'));
    
    // Mock os.homedir to return our temp directory
    vi.mocked(os.homedir).mockReturnValue(tempHomeDir);
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(tempHomeDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('getGlobalSherpaDir', () => {
    it('should return correct global sherpa directory path', () => {
      const globalDir = getGlobalSherpaDir();
      expect(globalDir).toBe(path.join(tempHomeDir, '.sherpa'));
    });
  });

  describe('hasGlobalSetup', () => {
    it('should return false when no global setup exists', async () => {
      const hasSetup = await hasGlobalSetup();
      expect(hasSetup).toBe(false);
    });

    it('should return true when global config exists', async () => {
      // Create global sherpa directory and config
      const globalDir = path.join(tempHomeDir, '.sherpa');
      await fs.mkdir(globalDir, { recursive: true });
      await fs.writeFile(path.join(globalDir, 'config.json'), '{}');

      const hasSetup = await hasGlobalSetup();
      expect(hasSetup).toBe(true);
    });
  });

  describe('getGlobalConfig', () => {
    it('should return null when no config exists', async () => {
      const config = await getGlobalConfig();
      expect(config).toBeNull();
    });

    it('should return config when it exists', async () => {
      const testConfig = {
        version: '0.1.0',
        setupDate: '2025-01-25T00:00:00.000Z',
        userLevel: 'experienced' as const,
        standards: { preset: 'fullstack-ts', customized: true },
        defaultPreset: 'fullstack-ts',
        projectCount: 5,
        lastUsed: '2025-01-25T12:00:00.000Z'
      };

      // Create global config
      const globalDir = path.join(tempHomeDir, '.sherpa');
      await fs.mkdir(globalDir, { recursive: true });
      await fs.writeFile(
        path.join(globalDir, 'config.json'),
        JSON.stringify(testConfig, null, 2)
      );

      const config = await getGlobalConfig();
      expect(config).toEqual(testConfig);
    });

    it('should handle invalid JSON gracefully', async () => {
      const globalDir = path.join(tempHomeDir, '.sherpa');
      await fs.mkdir(globalDir, { recursive: true });
      await fs.writeFile(path.join(globalDir, 'config.json'), 'invalid json');

      const config = await getGlobalConfig();
      expect(config).toBeNull();
    });
  });

  describe('updateGlobalConfig', () => {
    it('should update existing config', async () => {
      const initialConfig = {
        version: '0.1.0',
        setupDate: '2025-01-25T00:00:00.000Z',
        userLevel: 'beginner' as const,
        standards: { preset: 'custom', customized: false },
        defaultPreset: 'custom',
        projectCount: 0,
        lastUsed: '2025-01-25T00:00:00.000Z'
      };

      // Create initial config
      const globalDir = path.join(tempHomeDir, '.sherpa');
      await fs.mkdir(globalDir, { recursive: true });
      await fs.writeFile(
        path.join(globalDir, 'config.json'),
        JSON.stringify(initialConfig, null, 2)
      );

      // Update config
      const updates = {
        userLevel: 'experienced' as const,
        projectCount: 3,
        lastUsed: '2025-01-25T12:00:00.000Z'
      };

      await updateGlobalConfig(updates);

      // Verify update
      const updatedConfig = await getGlobalConfig();
      expect(updatedConfig).toEqual({
        ...initialConfig,
        ...updates
      });
    });

    it('should not update when no config exists', async () => {
      await updateGlobalConfig({ projectCount: 5 });

      const config = await getGlobalConfig();
      expect(config).toBeNull();
    });
  });

  describe('incrementProjectCount', () => {
    it('should increment project count and update last used', async () => {
      const initialConfig = {
        version: '0.1.0',
        setupDate: '2025-01-25T00:00:00.000Z',
        userLevel: 'experienced' as const,
        standards: { preset: 'fullstack-ts', customized: true },
        defaultPreset: 'fullstack-ts',
        projectCount: 2,
        lastUsed: '2025-01-25T00:00:00.000Z'
      };

      // Create initial config
      const globalDir = path.join(tempHomeDir, '.sherpa');
      await fs.mkdir(globalDir, { recursive: true });
      await fs.writeFile(
        path.join(globalDir, 'config.json'),
        JSON.stringify(initialConfig, null, 2)
      );

      await incrementProjectCount();

      const config = await getGlobalConfig();
      expect(config?.projectCount).toBe(3);
      expect(config?.lastUsed).not.toBe(initialConfig.lastUsed);
    });
  });

  describe('getGlobalStandardsPath', () => {
    it('should return null when no global setup exists', async () => {
      const path = await getGlobalStandardsPath();
      expect(path).toBeNull();
    });

    it('should return standards path when setup exists', async () => {
      // Create global config
      const globalDir = path.join(tempHomeDir, '.sherpa');
      await fs.mkdir(globalDir, { recursive: true });
      await fs.writeFile(path.join(globalDir, 'config.json'), '{}');

      const standardsPath = await getGlobalStandardsPath();
      expect(standardsPath).toBe(path.join(globalDir, 'standards'));
    });
  });

  describe('loadGlobalStandards', () => {
    it('should return null when no global setup exists', async () => {
      const standards = await loadGlobalStandards();
      expect(standards).toBeNull();
    });

    it('should load all standards files when they exist', async () => {
      // Create global setup
      const globalDir = path.join(tempHomeDir, '.sherpa');
      const standardsDir = path.join(globalDir, 'standards');
      await fs.mkdir(standardsDir, { recursive: true });
      await fs.writeFile(path.join(globalDir, 'config.json'), '{}');

      // Create standards files
      const codingContent = '# Development Best Practices\n\n## Core Principles\n- Keep it simple';
      const testingContent = '# Testing Standards\n\n## Framework\n- Use Vitest';
      const techStackContent = '# Tech Stack\n\n## Frontend\n- Next.js';

      await fs.writeFile(path.join(standardsDir, 'development-best-practices.md'), codingContent);
      await fs.writeFile(path.join(standardsDir, 'testing-standards.md'), testingContent);
      await fs.writeFile(path.join(standardsDir, 'tech-stack.md'), techStackContent);

      const standards = await loadGlobalStandards();

      expect(standards).toEqual({
        coding: codingContent,
        testing: testingContent,
        techstack: techStackContent
      });
    });

    it('should handle missing standards files gracefully', async () => {
      // Create global setup but no standards files
      const globalDir = path.join(tempHomeDir, '.sherpa');
      const standardsDir = path.join(globalDir, 'standards');
      await fs.mkdir(standardsDir, { recursive: true });
      await fs.writeFile(path.join(globalDir, 'config.json'), '{}');

      const standards = await loadGlobalStandards();

      expect(standards).toEqual({
        coding: '',
        testing: '',
        techstack: ''
      });
    });

    it('should return empty standards when standards files do not exist', async () => {
      // Create global setup but no standards directory
      const globalDir = path.join(tempHomeDir, '.sherpa');
      await fs.mkdir(globalDir, { recursive: true });
      await fs.writeFile(path.join(globalDir, 'config.json'), '{}');

      const standards = await loadGlobalStandards();

      expect(standards).toEqual({
        coding: '',
        testing: '',
        techstack: ''
      });
    });
  });

  describe('showGlobalSetupPrompt', () => {
    it('should display setup prompt message', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      showGlobalSetupPrompt();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Welcome to Sherpa OS!')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('sherpa setup')
      );

      consoleSpy.mockRestore();
    });
  });
});