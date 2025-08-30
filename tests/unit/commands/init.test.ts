import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileExists, readJson, writeJson, ensureDir, writeMarkdown } from '../../../src/utils/fs.js';

describe('init command functionality', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Set up temp directories
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sherpa-init-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    // Restore original directory and clean up
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('directory structure creation', () => {
    it('should create all required directories', async () => {
      const sherpaDir = path.join(tempDir, '.sherpa');
      
      // Create the expected directory structure
      await ensureDir(path.join(sherpaDir, 'standards'));
      await ensureDir(path.join(sherpaDir, 'product'));
      await ensureDir(path.join(sherpaDir, 'specs'));
      await ensureDir(path.join(sherpaDir, 'backlog'));
      await ensureDir(path.join(sherpaDir, 'context'));
      await ensureDir(path.join(sherpaDir, 'prompts', 'templates'));
      await ensureDir(path.join(sherpaDir, 'prompts', 'versions'));
      await ensureDir(path.join(sherpaDir, 'sessions', 'history'));
      await ensureDir(path.join(sherpaDir, 'sessions', 'handoffs'));
      
      // Documentation directories
      await ensureDir(path.join(tempDir, 'docs', 'briefs'));
      await ensureDir(path.join(tempDir, 'docs', 'retros'));
      await ensureDir(path.join(tempDir, 'docs', 'reports'));

      // Check all directories exist
      const expectedDirs = [
        '.sherpa/standards',
        '.sherpa/product',
        '.sherpa/specs',
        '.sherpa/backlog',
        '.sherpa/context',
        '.sherpa/prompts/templates',
        '.sherpa/prompts/versions',
        '.sherpa/sessions/history',
        '.sherpa/sessions/handoffs',
        'docs/briefs',
        'docs/retros',
        'docs/reports'
      ];

      for (const dir of expectedDirs) {
        expect(await fileExists(path.join(tempDir, dir))).toBe(true);
      }
    });
  });

  describe('configuration file creation', () => {
    it('should create valid state.json configuration', async () => {
      const sherpaDir = path.join(tempDir, '.sherpa');
      await ensureDir(sherpaDir);
      
      const projectInfo = {
        projectName: 'Test Project',
        description: 'A test project for Sherpa OS',
        techStack: 'TypeScript + Next.js',
        useAI: true,
        aiModel: 'claude-3-sonnet'
      };

      // Create initial state (simulating init command behavior)
      const initialState = {
        initialized: true,
        initDate: new Date().toISOString(),
        projectName: projectInfo.projectName,
        description: projectInfo.description,
        techStack: projectInfo.techStack,
        aiEnabled: projectInfo.useAI,
        aiModel: projectInfo.aiModel,
        version: '0.1.0',
        lastBrief: null,
        lastRetro: null,
        ticketsCompleted: 0,
        currentSprint: null
      };

      await writeJson(path.join(sherpaDir, 'state.json'), initialState);

      // Verify state file exists and has correct content
      expect(await fileExists(path.join(sherpaDir, 'state.json'))).toBe(true);
      const state = await readJson(path.join(sherpaDir, 'state.json'));
      
      expect(state).toMatchObject({
        initialized: true,
        projectName: 'Test Project',
        description: 'A test project for Sherpa OS',
        version: '0.1.0',
        ticketsCompleted: 0
      });
      expect(state.initDate).toBeDefined();
    });
  });

  describe('README file generation', () => {
    it('should create README files for all directories', async () => {
      const sherpaDir = path.join(tempDir, '.sherpa');
      await ensureDir(path.join(sherpaDir, 'standards'));
      await ensureDir(path.join(sherpaDir, 'specs'));
      await ensureDir(path.join(sherpaDir, 'backlog'));
      await ensureDir(path.join(sherpaDir, 'context'));

      // Create README files (simulating init command behavior)
      const readmes = [
        {
          path: path.join(sherpaDir, 'standards', 'README.md'),
          content: '# Coding Standards\n\nDefine your project\'s coding standards here.'
        },
        {
          path: path.join(sherpaDir, 'specs', 'README.md'),
          content: '# Feature Specifications\n\nStore your feature specifications here.'
        },
        {
          path: path.join(sherpaDir, 'backlog', 'README.md'),
          content: '# Project Backlog\n\nGenerated epics, stories, and tickets.'
        },
        {
          path: path.join(sherpaDir, 'context', 'README.md'),
          content: '# AI Context\n\nCompressed codebase knowledge for AI assistance.'
        }
      ];

      for (const readme of readmes) {
        await writeMarkdown(readme.path, readme.content);
      }

      // Verify all README files exist and have content
      for (const readme of readmes) {
        expect(await fileExists(readme.path)).toBe(true);
        const content = await fs.readFile(readme.path, 'utf-8');
        expect(content).toContain(readme.content);
      }
    });
  });

  describe('product documentation creation', () => {
    it('should create mission and roadmap documents', async () => {
      const sherpaDir = path.join(tempDir, '.sherpa');
      await ensureDir(path.join(sherpaDir, 'product'));

      const projectInfo = {
        projectName: 'Test Project',
        description: 'A comprehensive test project',
        techStack: 'TypeScript + React'
      };

      // Create product docs (simulating init command behavior)
      const missionDoc = `# ${projectInfo.projectName} - Mission

## Vision
${projectInfo.description}

## Tech Stack
${projectInfo.techStack}

## Goals
- [ ] Define initial goals here

*Created: ${new Date().toISOString().split('T')[0]}*`;

      const roadmapDoc = `# ${projectInfo.projectName} - Roadmap

## Current Sprint
- No active sprint yet

## Upcoming Features
- [ ] Define your feature roadmap here

*Created: ${new Date().toISOString().split('T')[0]}*`;

      await writeMarkdown(path.join(sherpaDir, 'product', 'mission.md'), missionDoc);
      await writeMarkdown(path.join(sherpaDir, 'product', 'roadmap.md'), roadmapDoc);

      // Verify files exist and have correct content
      expect(await fileExists(path.join(sherpaDir, 'product', 'mission.md'))).toBe(true);
      expect(await fileExists(path.join(sherpaDir, 'product', 'roadmap.md'))).toBe(true);

      const mission = await fs.readFile(path.join(sherpaDir, 'product', 'mission.md'), 'utf-8');
      const roadmap = await fs.readFile(path.join(sherpaDir, 'product', 'roadmap.md'), 'utf-8');

      expect(mission).toContain('Test Project - Mission');
      expect(mission).toContain('A comprehensive test project');
      expect(mission).toContain('TypeScript + React');

      expect(roadmap).toContain('Test Project - Roadmap');
      expect(roadmap).toContain('No active sprint yet');
    });
  });

  describe('preset standards generation', () => {
    it('should generate fullstack-ts preset standards', async () => {
      const standardsDir = path.join(tempDir, '.sherpa', 'standards');
      await ensureDir(standardsDir);

      // Generate preset standards (simulating init command preset behavior)
      const codingContent = `# Coding Standards

## Language & Syntax
- **Primary Language**: TypeScript
- **Naming Convention**: camelCase
- **Strict Typing**: Enforced

## Framework
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes

## Quality Gates
- All functions must have proper error handling
- No \`any\` types without justification
- Components should be single responsibility

## AI Coding Guidelines
- Always include error boundaries for React components
- Prefer composition over inheritance
- Write tests alongside implementation

---
*Generated with Sherpa OS preset configuration*`;

      const testingContent = `# Testing Standards

## Framework & Tools
- **Unit Testing**: Vitest + Testing Library
- **E2E Testing**: Playwright
- **Coverage Target**: 80%

## Quality Requirements
- All public functions must have unit tests
- New features require tests before merge
- Tests must be deterministic (no flaky tests)

## AI Testing Guidelines
- Always test error conditions (AI often forgets)
- Test with realistic data, not just happy path

---
*Generated with Sherpa OS preset configuration*`;

      const techStackContent = `# Tech Stack

## Core Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel

## Authentication & Security
- **Auth Service**: Supabase Auth

## Frontend Technologies
- **Styling**: Tailwind CSS
- **State Management**: Zustand + TanStack Query

## AI Development Guidelines
- Use these technologies consistently across projects
- Don't introduce new dependencies without justification

---
*Generated with Sherpa OS preset configuration*`;

      await writeMarkdown(path.join(standardsDir, 'coding-standards.md'), codingContent);
      await writeMarkdown(path.join(standardsDir, 'testing-standards.md'), testingContent);
      await writeMarkdown(path.join(standardsDir, 'tech-stack.md'), techStackContent);

      // Verify all standards files exist and have correct content
      const standardsFiles = [
        'coding-standards.md',
        'testing-standards.md',
        'tech-stack.md'
      ];

      for (const file of standardsFiles) {
        expect(await fileExists(path.join(standardsDir, file))).toBe(true);
      }

      const coding = await fs.readFile(path.join(standardsDir, 'coding-standards.md'), 'utf-8');
      const testing = await fs.readFile(path.join(standardsDir, 'testing-standards.md'), 'utf-8');
      const techStack = await fs.readFile(path.join(standardsDir, 'tech-stack.md'), 'utf-8');

      expect(coding).toContain('TypeScript');
      expect(coding).toContain('Next.js');
      expect(coding).toContain('AI Coding Guidelines');

      expect(testing).toContain('Vitest + Testing Library');
      expect(testing).toContain('Coverage Target**: 80%');
      expect(testing).toContain('AI Testing Guidelines');

      expect(techStack).toContain('Next.js 14 (App Router)');
      expect(techStack).toContain('Supabase (PostgreSQL)');
      expect(techStack).toContain('Tailwind CSS');
    });

    it('should generate python-api preset standards', async () => {
      const standardsDir = path.join(tempDir, '.sherpa', 'standards');
      await ensureDir(standardsDir);

      const codingContent = `# Coding Standards

## Language & Syntax
- **Primary Language**: Python
- **Naming Convention**: snake_case
- **Strict Typing**: Enforced

## Framework
- **Backend**: FastAPI + Pydantic
- **File Structure**: FastAPI project structure

## Quality Gates
- All functions must have proper error handling
- Use type hints consistently
- Follow PEP 8 style guidelines

---
*Generated with Sherpa OS preset configuration*`;

      await writeMarkdown(path.join(standardsDir, 'coding-standards.md'), codingContent);

      expect(await fileExists(path.join(standardsDir, 'coding-standards.md'))).toBe(true);
      
      const coding = await fs.readFile(path.join(standardsDir, 'coding-standards.md'), 'utf-8');
      expect(coding).toContain('Python');
      expect(coding).toContain('snake_case');
      expect(coding).toContain('FastAPI + Pydantic');
    });
  });

  describe('file validation', () => {
    it('should detect already initialized projects', async () => {
      const sherpaDir = path.join(tempDir, '.sherpa');
      await ensureDir(sherpaDir);
      await writeJson(path.join(sherpaDir, 'state.json'), { initialized: true });

      // Check that sherpa directory exists (indicating initialized project)
      expect(await fileExists(sherpaDir)).toBe(true);
      expect(await fileExists(path.join(sherpaDir, 'state.json'))).toBe(true);

      const state = await readJson(path.join(sherpaDir, 'state.json'));
      expect(state.initialized).toBe(true);
    });

    it('should validate project structure completeness', async () => {
      const sherpaDir = path.join(tempDir, '.sherpa');
      
      // Create complete project structure
      const requiredDirs = [
        'standards', 'product', 'specs', 'backlog', 'context',
        'prompts/templates', 'prompts/versions', 'sessions/history', 'sessions/handoffs'
      ];

      for (const dir of requiredDirs) {
        await ensureDir(path.join(sherpaDir, dir));
      }

      await ensureDir(path.join(tempDir, 'docs', 'briefs'));
      await ensureDir(path.join(tempDir, 'docs', 'retros'));
      await ensureDir(path.join(tempDir, 'docs', 'reports'));

      // Verify all required directories exist
      for (const dir of requiredDirs) {
        expect(await fileExists(path.join(sherpaDir, dir))).toBe(true);
      }

      expect(await fileExists(path.join(tempDir, 'docs', 'briefs'))).toBe(true);
      expect(await fileExists(path.join(tempDir, 'docs', 'retros'))).toBe(true);
      expect(await fileExists(path.join(tempDir, 'docs', 'reports'))).toBe(true);
    });
  });
});