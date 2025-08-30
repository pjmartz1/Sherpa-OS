import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileExists, readJson, writeJson } from './fs.js';

export interface GlobalConfig {
  version: string;
  setupDate: string;
  userLevel: 'beginner' | 'experienced' | 'expert';
  standards: {
    preset: string;
    customized: boolean;
    [key: string]: any;
  };
  defaultPreset: string;
  projectCount: number;
  lastUsed: string;
}

export function getGlobalSherpaDir(): string {
  return path.join(os.homedir(), '.sherpa');
}

export async function hasGlobalSetup(): Promise<boolean> {
  const globalDir = getGlobalSherpaDir();
  const configPath = path.join(globalDir, 'config.json');
  return await fileExists(configPath);
}

export async function getGlobalConfig(): Promise<GlobalConfig | null> {
  try {
    const configPath = path.join(getGlobalSherpaDir(), 'config.json');
    if (await fileExists(configPath)) {
      return await readJson<GlobalConfig>(configPath);
    }
  } catch (error) {
    console.warn('Warning: Could not load global config:', error);
  }
  return null;
}

export async function updateGlobalConfig(updates: Partial<GlobalConfig>): Promise<void> {
  const currentConfig = await getGlobalConfig();
  if (currentConfig) {
    const updatedConfig = { ...currentConfig, ...updates };
    const configPath = path.join(getGlobalSherpaDir(), 'config.json');
    await writeJson(configPath, updatedConfig);
  }
}

export async function incrementProjectCount(): Promise<void> {
  const config = await getGlobalConfig();
  if (config) {
    await updateGlobalConfig({
      projectCount: config.projectCount + 1,
      lastUsed: new Date().toISOString()
    });
  }
}

export async function getGlobalStandardsPath(): Promise<string | null> {
  if (await hasGlobalSetup()) {
    return path.join(getGlobalSherpaDir(), 'standards');
  }
  return null;
}

export async function loadGlobalStandards(): Promise<{ coding: string, testing: string, techstack: string } | null> {
  const standardsPath = await getGlobalStandardsPath();
  if (!standardsPath) return null;

  try {
    const standards = { coding: '', testing: '', techstack: '' };

    // Load development standards
    const developmentPath = path.join(standardsPath, 'development-best-practices.md');
    if (await fileExists(developmentPath)) {
      standards.coding = await fs.readFile(developmentPath, 'utf-8');
    }

    // Load tech stack
    const techStackPath = path.join(standardsPath, 'tech-stack.md');
    if (await fileExists(techStackPath)) {
      standards.techstack = await fs.readFile(techStackPath, 'utf-8');
    }

    // Load testing standards
    const testingPath = path.join(standardsPath, 'testing-standards.md');
    if (await fileExists(testingPath)) {
      standards.testing = await fs.readFile(testingPath, 'utf-8');
    }

    return standards;
  } catch (error) {
    console.warn('Warning: Could not load global standards:', error);
    return null;
  }
}

export function showGlobalSetupPrompt(): void {
  console.log(`
🚀 Welcome to Sherpa OS!

It looks like this is your first time using Sherpa. 

To get started, you need to run the global setup (one-time only):
    
    sherpa setup

This will configure your coding standards and preferences globally.
After setup, you can initialize projects with:

    sherpa init
`);
}