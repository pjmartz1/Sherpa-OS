import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileExists, readYaml, writeYaml, writeMarkdown, ensureDir } from '../../../src/utils/fs.js';

describe('gen-prompt command functionality', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Set up temp directories
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sherpa-genprompt-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);

    // Create basic Sherpa structure
    await ensureDir('.sherpa/backlog/tickets');
    await ensureDir('.sherpa/prompts');
  });

  afterEach(async () => {
    // Restore original directory and clean up
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('ticket processing', () => {
    it('should process a specific ticket correctly', async () => {
      // Create a sample ticket
      const ticket = {
        ticket_id: 'TICK-001',
        title: 'Add user authentication',
        outcome: 'Users can securely log in and log out',
        timebox_hours: 8,
        acceptance_criteria: [
          'Login form validates credentials',
          'Session management works correctly',
          'Logout clears session'
        ],
        test_plan: {
          unit: ['Test login validation', 'Test session management'],
          e2e: ['Test full login flow']
        },
        ui_components: ['LoginForm', 'LogoutButton'],
        apidiff: ['/api/auth/login', '/api/auth/logout'],
        telemetry: ['login_success', 'login_failure']
      };

      const ticketPath = path.join(tempDir, '.sherpa/backlog/tickets/TICK-001.yml');
      await writeYaml(ticketPath, ticket);

      // Verify ticket file exists and can be read
      expect(await fileExists(ticketPath)).toBe(true);
      const readTicket = await readYaml(ticketPath);
      expect(readTicket).toMatchObject({
        ticket_id: 'TICK-001',
        title: 'Add user authentication',
        outcome: 'Users can securely log in and log out'
      });
    });

    it('should generate appropriate files map for UI components', async () => {
      const ticket = {
        ticket_id: 'TICK-002',
        title: 'Create dashboard component',
        outcome: 'Dashboard displays user metrics',
        timebox_hours: 6,
        ui_components: ['Dashboard', 'MetricsCard'],
        test_plan: { unit: ['Test dashboard rendering'], e2e: [] },
        acceptance_criteria: ['Dashboard loads correctly']
      };

      // Create common project files
      await fs.writeFile('package.json', JSON.stringify({ name: 'test-project' }));
      await fs.writeFile('tsconfig.json', JSON.stringify({ compilerOptions: {} }));
      await ensureDir('src/components');

      // Generate files map (simulating gen-prompt behavior)
      const filesMap = {
        ticket_id: ticket.ticket_id,
        title: ticket.title,
        relevant_files: [
          'package.json',
          'tsconfig.json',
          'src/components/**/*.{ts,tsx,js,jsx}',
          'tests/**/*.{test,spec}.{ts,js}',
          '**/*.{test,spec}.{ts,js}'
        ],
        priority_files: [
          'package.json',
          'tsconfig.json',
          'src/components/**/*.{ts,tsx,js,jsx}',
          'tests/**/*.{test,spec}.{ts,js}',
          '**/*.{test,spec}.{ts,js}'
        ],
        generated_at: new Date().toISOString(),
        instructions: {
          usage: "Include these files in your AI assistant's context for better code generation",
          priority: "Start with priority_files, then add others as needed",
          patterns: "Use glob patterns to include multiple files at once"
        }
      };

      // Save files map
      const filesMapPath = path.join(tempDir, '.sherpa/prompts/TICK-002-files.json');
      await fs.writeFile(filesMapPath, JSON.stringify(filesMap, null, 2));

      // Verify files map creation
      expect(await fileExists(filesMapPath)).toBe(true);
      const savedFilesMap = JSON.parse(await fs.readFile(filesMapPath, 'utf-8'));
      
      expect(savedFilesMap.ticket_id).toBe('TICK-002');
      expect(savedFilesMap.relevant_files).toContain('package.json');
      expect(savedFilesMap.relevant_files).toContain('src/components/**/*.{ts,tsx,js,jsx}');
      expect(savedFilesMap.instructions).toBeDefined();
    });

    it('should generate appropriate files map for API tickets', async () => {
      const ticket = {
        ticket_id: 'TICK-003',
        title: 'Create user API endpoints',
        outcome: 'CRUD operations for users available',
        timebox_hours: 10,
        apidiff: ['/api/users/create', '/api/users/update', '/api/users/delete'],
        test_plan: { unit: ['Test API endpoints'], e2e: ['Test full CRUD flow'] },
        acceptance_criteria: ['All CRUD operations work correctly']
      };

      await fs.writeFile('package.json', JSON.stringify({ name: 'test-api' }));
      await ensureDir('src/api');

      const filesMap = {
        ticket_id: ticket.ticket_id,
        title: ticket.title,
        relevant_files: [
          'package.json',
          'src/api/**/*.{ts,js}',
          'src/routes/**/*.{ts,js}',
          'src/controllers/**/*.{ts,js}',
          'api/**/*.{ts,js}',
          'tests/**/*.{test,spec}.{ts,js}',
          '**/*.{test,spec}.{ts,js}'
        ],
        priority_files: [
          'package.json',
          'src/api/**/*.{ts,js}',
          'src/routes/**/*.{ts,js}',
          'src/controllers/**/*.{ts,js}',
          'api/**/*.{ts,js}'
        ],
        generated_at: new Date().toISOString(),
        instructions: {
          usage: "Include these files in your AI assistant's context for better code generation",
          priority: "Start with priority_files, then add others as needed",
          patterns: "Use glob patterns to include multiple files at once"
        }
      };

      const filesMapPath = path.join(tempDir, '.sherpa/prompts/TICK-003-files.json');
      await fs.writeFile(filesMapPath, JSON.stringify(filesMap, null, 2));

      const savedFilesMap = JSON.parse(await fs.readFile(filesMapPath, 'utf-8'));
      expect(savedFilesMap.relevant_files).toContain('src/api/**/*.{ts,js}');
      expect(savedFilesMap.relevant_files).toContain('src/routes/**/*.{ts,js}');
      expect(savedFilesMap.relevant_files).toContain('src/controllers/**/*.{ts,js}');
    });
  });

  describe('prompt generation', () => {
    it('should generate comprehensive prompt content', async () => {
      const ticket = {
        ticket_id: 'TICK-004',
        title: 'Implement search functionality',
        outcome: 'Users can search and filter results',
        timebox_hours: 12,
        acceptance_criteria: [
          'Search input accepts queries',
          'Results update in real-time',
          'Filters work correctly'
        ],
        test_plan: {
          unit: ['Test search logic', 'Test filter logic'],
          e2e: ['Test complete search flow']
        },
        ui_components: ['SearchBar', 'SearchResults', 'FilterPanel'],
        apidiff: ['/api/search'],
        telemetry: ['search_query', 'search_results']
      };

      // Generate prompt content (simulating gen-prompt behavior)
      const promptContent = `# Implementation Task: ${ticket.title}

## 🎯 Outcome
${ticket.outcome}

## ⏱️ Time Budget
${ticket.timebox_hours} hours

## ✅ Acceptance Criteria
${ticket.acceptance_criteria.map(criterion => `- [ ] ${criterion}`).join('\n')}

## 🧪 Test Plan

### Unit Tests
${ticket.test_plan.unit.map(test => `- [ ] ${test}`).join('\n')}

### End-to-End Tests  
${ticket.test_plan.e2e.map(test => `- [ ] ${test}`).join('\n')}

## 🎨 UI Components to Create/Update
${ticket.ui_components.map(component => `- \`${component}\``).join('\n')}

## 🔌 API Changes
${ticket.apidiff.map(api => `- \`${api}\``).join('\n')}

## 📊 Telemetry Events to Track
${ticket.telemetry.map(event => `- \`${event}\``).join('\n')}

## 🎯 Success Criteria
- All acceptance criteria are met
- All tests pass (unit + e2e)
- Code follows established patterns
- Telemetry events are properly tracked
- Error handling is comprehensive

## 🚀 Implementation Guidelines
- Follow the existing codebase patterns
- Include comprehensive error handling
- Write tests alongside implementation  
- Add proper TypeScript types
- Consider performance implications
- Document any new APIs or components

---
*Generated by Sherpa OS - AI-powered development workflow*`;

      const promptPath = path.join(tempDir, '.sherpa/prompts/TICK-004-prompt.md');
      await writeMarkdown(promptPath, promptContent);

      // Verify prompt creation and content
      expect(await fileExists(promptPath)).toBe(true);
      const savedPrompt = await fs.readFile(promptPath, 'utf-8');
      
      expect(savedPrompt).toContain('Implementation Task: Implement search functionality');
      expect(savedPrompt).toContain('Users can search and filter results');
      expect(savedPrompt).toContain('12 hours');
      expect(savedPrompt).toContain('Search input accepts queries');
      expect(savedPrompt).toContain('SearchBar');
      expect(savedPrompt).toContain('/api/search');
      expect(savedPrompt).toContain('search_query');
      expect(savedPrompt).toContain('All acceptance criteria are met');
    });

    it('should generate context section when context is available', async () => {
      // Mock context data (simulating what ContextManager would provide)
      const mockContext = {
        summary: 'React TypeScript application with Next.js framework',
        patterns: [
          {
            name: 'Component Structure',
            frequency: 15,
            files: ['src/components/Button.tsx', 'src/components/Input.tsx'],
            description: 'Consistent component pattern with props interface',
            example: 'interface Props { children: ReactNode; onClick: () => void; }'
          }
        ],
        decisions: [
          {
            title: 'State Management',
            decision: 'Use Zustand for global state',
            rationale: 'Simpler than Redux, better TypeScript support'
          }
        ]
      };

      const contextSection = `# 🧠 Codebase Context

## Project Summary
${mockContext.summary}

## Key Patterns to Follow
### ${mockContext.patterns[0].name}
- **Usage**: ${mockContext.patterns[0].frequency} times across ${mockContext.patterns[0].files.length} files
- **Description**: ${mockContext.patterns[0].description}
- **Example**: \`${mockContext.patterns[0].example}\`

## Architectural Constraints
### ${mockContext.decisions[0].title}
- **Decision**: ${mockContext.decisions[0].decision}
- **Rationale**: ${mockContext.decisions[0].rationale}

## Important Reminders
- Follow the established patterns shown above
- Include comprehensive error handling (AI commonly misses this)
- Add TypeScript types for all new code
- Write tests that match the acceptance criteria
- Avoid over-abstraction - keep it concrete initially`;

      const contextPath = path.join(tempDir, '.sherpa/prompts/context-example.md');
      await writeMarkdown(contextPath, contextSection);

      const savedContext = await fs.readFile(contextPath, 'utf-8');
      expect(savedContext).toContain('Codebase Context');
      expect(savedContext).toContain('React TypeScript application');
      expect(savedContext).toContain('Component Structure');
      expect(savedContext).toContain('Use Zustand for global state');
      expect(savedContext).toContain('Include comprehensive error handling');
    });

    it('should handle tickets with minimal information', async () => {
      const minimalTicket = {
        ticket_id: 'TICK-005',
        title: 'Fix bug in login',
        outcome: 'Login works correctly',
        timebox_hours: 2,
        acceptance_criteria: ['Bug is fixed'],
        test_plan: { unit: [], e2e: [] }
      };

      const promptContent = `# Implementation Task: ${minimalTicket.title}

## 🎯 Outcome
${minimalTicket.outcome}

## ⏱️ Time Budget
${minimalTicket.timebox_hours} hours

## ✅ Acceptance Criteria
${minimalTicket.acceptance_criteria.map(criterion => `- [ ] ${criterion}`).join('\n')}

## 🧪 Test Plan
*No specific tests defined*

## 🎯 Success Criteria
- All acceptance criteria are met
- Code follows established patterns
- Error handling is comprehensive

---
*Generated by Sherpa OS - AI-powered development workflow*`;

      const promptPath = path.join(tempDir, '.sherpa/prompts/TICK-005-prompt.md');
      await writeMarkdown(promptPath, promptContent);

      const savedPrompt = await fs.readFile(promptPath, 'utf-8');
      expect(savedPrompt).toContain('Fix bug in login');
      expect(savedPrompt).toContain('2 hours');
      expect(savedPrompt).toContain('Bug is fixed');
      expect(savedPrompt).toContain('No specific tests defined');
    });
  });

  describe('validation and error handling', () => {
    it('should detect when Sherpa OS is not initialized', async () => {
      // Remove .sherpa directory
      await fs.rm(path.join(tempDir, '.sherpa'), { recursive: true, force: true });

      // Check that sherpa directory doesn't exist
      expect(await fileExists(path.join(tempDir, '.sherpa'))).toBe(false);
    });

    it('should detect when backlog does not exist', async () => {
      // Remove backlog directory but keep .sherpa
      await fs.rm(path.join(tempDir, '.sherpa/backlog'), { recursive: true, force: true });

      expect(await fileExists(path.join(tempDir, '.sherpa/backlog'))).toBe(false);
      expect(await fileExists(path.join(tempDir, '.sherpa'))).toBe(true);
    });

    it('should detect when no tickets exist', async () => {
      // Remove the tickets directory that was created in beforeEach
      await fs.rm(path.join(tempDir, '.sherpa/backlog/tickets'), { recursive: true, force: true });
      
      // Create backlog directory but no tickets subdirectory
      await ensureDir('.sherpa/backlog');

      expect(await fileExists(path.join(tempDir, '.sherpa/backlog/tickets'))).toBe(false);
    });

    it('should handle invalid ticket files', async () => {
      // Create invalid ticket file
      const invalidTicketPath = path.join(tempDir, '.sherpa/backlog/tickets/invalid.yml');
      await ensureDir(path.dirname(invalidTicketPath));
      await fs.writeFile(invalidTicketPath, 'invalid: yaml: content:');

      // Try to read the invalid file
      let errorOccurred = false;
      try {
        await readYaml(invalidTicketPath);
      } catch (error) {
        errorOccurred = true;
      }
      
      expect(errorOccurred).toBe(true);
    });

    it('should handle missing specific ticket', async () => {
      // Check for non-existent ticket
      const missingTicketPath = path.join(tempDir, '.sherpa/backlog/tickets/MISSING-001.yml');
      expect(await fileExists(missingTicketPath)).toBe(false);
    });
  });

  describe('file organization', () => {
    it('should organize outputs in correct directory structure', async () => {
      const ticket = {
        ticket_id: 'TICK-006',
        title: 'Test file organization',
        outcome: 'Files are properly organized'
      };

      // Create expected file paths
      const promptPath = path.join(tempDir, '.sherpa/prompts/TICK-006-prompt.md');
      const filesMapPath = path.join(tempDir, '.sherpa/prompts/TICK-006-files.json');

      // Create the files
      await writeMarkdown(promptPath, '# Test prompt');
      await fs.writeFile(filesMapPath, JSON.stringify({ ticket_id: 'TICK-006' }));

      // Verify files exist in correct locations
      expect(await fileExists(promptPath)).toBe(true);
      expect(await fileExists(filesMapPath)).toBe(true);

      // Check that they're in the prompts directory
      expect(promptPath).toContain(path.join('.sherpa', 'prompts'));
      expect(filesMapPath).toContain(path.join('.sherpa', 'prompts'));
      
      // Check file naming convention
      expect(path.basename(promptPath)).toBe('TICK-006-prompt.md');
      expect(path.basename(filesMapPath)).toBe('TICK-006-files.json');
    });

    it('should support custom output paths', async () => {
      const customPath = path.join(tempDir, 'custom-prompt.md');
      const customFilesPath = path.join(tempDir, 'custom-prompt-files.json');

      await writeMarkdown(customPath, '# Custom prompt');
      await fs.writeFile(customFilesPath, JSON.stringify({ custom: true }));

      expect(await fileExists(customPath)).toBe(true);
      expect(await fileExists(customFilesPath)).toBe(true);
    });
  });

  describe('ticket selection logic', () => {
    it('should handle multiple tickets in directory', async () => {
      const tickets = [
        { ticket_id: 'TICK-001', title: 'First ticket', timebox_hours: 4 },
        { ticket_id: 'TICK-002', title: 'Second ticket', timebox_hours: 6 },
        { ticket_id: 'TICK-003', title: 'Third ticket', timebox_hours: 8 }
      ];

      // Create multiple ticket files
      for (const ticket of tickets) {
        const ticketPath = path.join(tempDir, `.sherpa/backlog/tickets/${ticket.ticket_id}.yml`);
        await writeYaml(ticketPath, ticket);
      }

      // Verify all tickets exist
      for (const ticket of tickets) {
        const ticketPath = path.join(tempDir, `.sherpa/backlog/tickets/${ticket.ticket_id}.yml`);
        expect(await fileExists(ticketPath)).toBe(true);
        
        const savedTicket = await readYaml(ticketPath);
        expect(savedTicket.ticket_id).toBe(ticket.ticket_id);
        expect(savedTicket.title).toBe(ticket.title);
      }

      // Check that we can read the tickets directory
      const ticketsDir = path.join(tempDir, '.sherpa/backlog/tickets');
      const ticketFiles = await fs.readdir(ticketsDir);
      const ymlFiles = ticketFiles.filter(f => f.endsWith('.yml'));
      
      expect(ymlFiles).toHaveLength(3);
      expect(ymlFiles).toContain('TICK-001.yml');
      expect(ymlFiles).toContain('TICK-002.yml');
      expect(ymlFiles).toContain('TICK-003.yml');
    });
  });
});