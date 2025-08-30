import { promises as fs } from 'fs';
import * as path from 'path';
import { getSherpaDir, ensureDir, writeJson, readJson, fileExists, writeMarkdown } from './fs.js';
import { ContextManager, CompressedContext } from './context.js';
import { Ticket, Spec } from '../types/index.js';

export interface PromptTemplate {
  id: string;
  name: string;
  category: 'feature' | 'bugfix' | 'refactor' | 'test' | 'docs';
  template: string;
  variables: string[];
  successRate: number;
  usageCount: number;
  lastUsed: string;
  aiModel?: string;
}

export interface PromptVersion {
  id: string;
  templateId: string;
  version: string;
  content: string;
  metadata: {
    createdAt: string;
    usedFor: string;
    outcome: 'success' | 'failure' | 'partial';
    feedback: string;
  };
}

export interface PromptPerformance {
  templateId: string;
  totalUses: number;
  successCount: number;
  failureCount: number;
  averageRating: number;
  commonIssues: string[];
  lastAnalyzed: string;
}

export class PromptManager {
  private promptsDir: string;
  private templatesPath: string;
  private versionsPath: string;
  private performancePath: string;
  private contextManager: ContextManager;

  constructor() {
    this.promptsDir = path.join(getSherpaDir(), 'prompts');
    this.templatesPath = path.join(this.promptsDir, 'templates');
    this.versionsPath = path.join(this.promptsDir, 'versions');
    this.performancePath = path.join(this.promptsDir, 'performance.json');
    this.contextManager = new ContextManager();
  }

  async initializePrompts(): Promise<void> {
    await ensureDir(this.templatesPath);
    await ensureDir(this.versionsPath);
    
    // Create default templates if they don't exist
    const defaultTemplates = this.getDefaultTemplates();
    
    for (const template of defaultTemplates) {
      const templatePath = path.join(this.templatesPath, `${template.id}.json`);
      if (!await fileExists(templatePath)) {
        await writeJson(templatePath, template);
      }
    }
  }

  private getDefaultTemplates(): PromptTemplate[] {
    return [
      {
        id: 'feature-implementation',
        name: 'Feature Implementation',
        category: 'feature',
        template: `# Feature Implementation Task

## Context
{{CONTEXT_SUMMARY}}

## Development Standards
{{DEVELOPMENT_STANDARDS}}

## Tech Stack
{{TECH_STACK}}

## Testing Standards
{{TESTING_STANDARDS}}

## Patterns to Follow
{{CODE_PATTERNS}}

## Architectural Constraints
{{ARCHITECTURAL_DECISIONS}}

## Task Requirements
**Feature**: {{FEATURE_NAME}}
**Outcome**: {{EXPECTED_OUTCOME}}

**Acceptance Criteria**:
{{ACCEPTANCE_CRITERIA}}

**API Changes**:
{{API_DIFF}}

**UI Components**:
{{UI_COMPONENTS}}

## Test Requirements
{{TEST_PLAN}}

## Important Reminders
- Follow the development standards and tech stack specified above
- Use only the technologies listed in the tech stack
- Follow established code patterns shown above
- Include comprehensive error handling (common AI oversight)
- Add proper TypeScript types for all new code
- Write tests that match the acceptance criteria
- Avoid over-abstraction - keep it concrete initially

## Files to Reference
{{RELEVANT_FILES}}

## Common Pitfalls to Avoid
{{PITFALLS}}

## AI-Specific Guidelines
- Don't introduce new dependencies without checking the tech stack first
- Follow the exact naming conventions specified in standards
- Implement error handling patterns consistently
- Write tests alongside implementation, not as an afterthought`,
        variables: ['CONTEXT_SUMMARY', 'DEVELOPMENT_STANDARDS', 'TECH_STACK', 'TESTING_STANDARDS', 'CODE_PATTERNS', 'ARCHITECTURAL_DECISIONS', 'FEATURE_NAME', 'EXPECTED_OUTCOME', 'ACCEPTANCE_CRITERIA', 'API_DIFF', 'UI_COMPONENTS', 'TEST_PLAN', 'RELEVANT_FILES', 'PITFALLS'],
        successRate: 0,
        usageCount: 0,
        lastUsed: '',
        aiModel: 'any'
      },
      {
        id: 'bug-fix',
        name: 'Bug Fix',
        category: 'bugfix',
        template: `# Bug Fix Task

## Context
{{CONTEXT_SUMMARY}}

## Current Patterns
{{CODE_PATTERNS}}

## Bug Report
**Issue**: {{BUG_DESCRIPTION}}
**Expected**: {{EXPECTED_BEHAVIOR}}
**Actual**: {{ACTUAL_BEHAVIOR}}
**Steps to Reproduce**: {{REPRODUCTION_STEPS}}

## Files Involved
{{RELEVANT_FILES}}

## Fix Requirements
- Maintain existing patterns and architecture
- Add tests to prevent regression
- Update documentation if necessary
- Consider edge cases that might have similar issues

## Test Strategy
{{TEST_PLAN}}

## Avoid These Common Mistakes
{{PITFALLS}}`,
        variables: ['CONTEXT_SUMMARY', 'CODE_PATTERNS', 'BUG_DESCRIPTION', 'EXPECTED_BEHAVIOR', 'ACTUAL_BEHAVIOR', 'REPRODUCTION_STEPS', 'RELEVANT_FILES', 'TEST_PLAN', 'PITFALLS'],
        successRate: 0,
        usageCount: 0,
        lastUsed: '',
        aiModel: 'any'
      },
      {
        id: 'refactor',
        name: 'Code Refactoring',
        category: 'refactor',
        template: `# Refactoring Task

## Context
{{CONTEXT_SUMMARY}}

## Current Patterns
{{CODE_PATTERNS}}

## Refactoring Goal
**Target**: {{REFACTOR_TARGET}}
**Reason**: {{REFACTOR_REASON}}
**Success Criteria**: {{SUCCESS_CRITERIA}}

## Constraints
- Must maintain existing functionality (no behavior changes)
- Keep existing tests passing
- Follow established patterns
- Improve code quality metrics

## Architectural Decisions to Respect
{{ARCHITECTURAL_DECISIONS}}

## Files to Modify
{{RELEVANT_FILES}}

## Testing Strategy
- All existing tests must pass
- Add tests for new internal structure if needed
- Consider integration test coverage

## Common Refactoring Pitfalls
{{PITFALLS}}`,
        variables: ['CONTEXT_SUMMARY', 'CODE_PATTERNS', 'REFACTOR_TARGET', 'REFACTOR_REASON', 'SUCCESS_CRITERIA', 'ARCHITECTURAL_DECISIONS', 'RELEVANT_FILES', 'PITFALLS'],
        successRate: 0,
        usageCount: 0,
        lastUsed: '',
        aiModel: 'any'
      }
    ];
  }

  async generatePrompt(ticket: Ticket, spec?: Spec): Promise<string> {
    const context = await this.contextManager.getCompressedContext();
    if (!context) {
      throw new Error('No context found. Run `sherpa context:build` first.');
    }

    // Determine the best template based on ticket content
    const template = await this.selectBestTemplate(ticket, spec);
    
    // Get relevant context for this specific task
    const relevantContext = await this.contextManager.searchSimilarContext(
      `${ticket.title} ${ticket.outcome}`
    );

    // Load development standards
    const standards = await this.loadStandards();

    // Build the prompt by replacing variables
    const promptContent = this.fillTemplate(template, {
      ticket,
      spec,
      context,
      relevantContext,
      standards
    });

    // Save this prompt version for performance tracking
    await this.savePromptVersion(template.id, promptContent, ticket);

    return promptContent;
  }

  private async selectBestTemplate(ticket: Ticket, spec?: Spec): Promise<PromptTemplate> {
    const templates = await this.getTemplates();
    
    // Simple heuristics to select template - in practice, could be more sophisticated
    if (ticket.title.toLowerCase().includes('fix') || ticket.title.toLowerCase().includes('bug')) {
      const template = templates.find(t => t.category === 'bugfix');
      if (template) return template;
    }
    
    if (ticket.title.toLowerCase().includes('refactor') || ticket.outcome.includes('improve')) {
      const template = templates.find(t => t.category === 'refactor');
      if (template) return template;
    }

    // Default to feature implementation
    const featureTemplate = templates.find(t => t.category === 'feature');
    if (featureTemplate) return featureTemplate;
    
    throw new Error('No prompt template found');
  }

  private fillTemplate(template: PromptTemplate, data: {
    ticket: Ticket;
    spec?: Spec;
    context: CompressedContext;
    relevantContext: { patterns: any[], decisions: any[] };
    standards?: { coding: string, testing: string, techstack: string };
  }): string {
    let content = template.template;

    // Replace variables with actual content
    const replacements: Record<string, string> = {
      CONTEXT_SUMMARY: data.context.summary,
      CODE_PATTERNS: this.formatPatterns(data.relevantContext.patterns),
      ARCHITECTURAL_DECISIONS: this.formatDecisions(data.relevantContext.decisions),
      DEVELOPMENT_STANDARDS: data.standards?.coding || 'No coding standards found',
      TESTING_STANDARDS: data.standards?.testing || 'No testing standards found',
      TECH_STACK: data.standards?.techstack || 'No tech stack documented',
      FEATURE_NAME: data.ticket.title,
      EXPECTED_OUTCOME: data.ticket.outcome,
      ACCEPTANCE_CRITERIA: data.ticket.acceptance_criteria.map(ac => `- ${ac}`).join('\n'),
      API_DIFF: data.ticket.apidiff?.map(api => `- ${api}`).join('\n') || 'None specified',
      UI_COMPONENTS: data.ticket.ui_components?.map(ui => `- ${ui}`).join('\n') || 'None specified',
      TEST_PLAN: this.formatTestPlan(data.ticket.test_plan),
      RELEVANT_FILES: this.getRelevantFiles(data.relevantContext.patterns),
      PITFALLS: this.formatPitfalls(data.context.pitfalls),
      BUG_DESCRIPTION: data.ticket.outcome,
      EXPECTED_BEHAVIOR: 'As described in acceptance criteria',
      ACTUAL_BEHAVIOR: 'Current behavior differs from expected',
      REPRODUCTION_STEPS: 'Steps to reproduce the issue',
      REFACTOR_TARGET: data.ticket.title,
      REFACTOR_REASON: data.ticket.outcome,
      SUCCESS_CRITERIA: data.ticket.acceptance_criteria.join(', ')
    };

    // Replace all variables in the template
    for (const [variable, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, value || 'Not specified');
    }

    return content;
  }

  private formatPatterns(patterns: any[]): string {
    return patterns.slice(0, 5).map(pattern => 
      `### ${pattern.name}\n- Used ${pattern.frequency}x across ${pattern.files.length} files\n- ${pattern.description}\n- Example: \`${pattern.example}\``
    ).join('\n\n');
  }

  private formatDecisions(decisions: any[]): string {
    return decisions.map(decision =>
      `### ${decision.title}\n- **Decision**: ${decision.decision}\n- **Rationale**: ${decision.rationale}`
    ).join('\n\n');
  }

  private async loadStandards(): Promise<{ coding: string, testing: string, techstack: string }> {
    const standardsDir = path.join(getSherpaDir(), 'standards');
    const standards = { coding: '', testing: '', techstack: '' };

    try {
      // Try to load modular standards first
      const codingFiles = ['development-best-practices.md', 'code-style-guide.md'];
      let codingContent = '';
      
      for (const file of codingFiles) {
        const filePath = path.join(standardsDir, file);
        if (await fileExists(filePath)) {
          const content = await fs.readFile(filePath, 'utf-8');
          codingContent += content + '\n\n';
        }
      }

      // Fallback to single file if modular doesn't exist
      if (!codingContent) {
        const fallbackPath = path.join(standardsDir, 'coding-standards.md');
        if (await fileExists(fallbackPath)) {
          codingContent = await fs.readFile(fallbackPath, 'utf-8');
        }
      }

      standards.coding = codingContent || 'No coding standards found. Run `sherpa add:standard` to create.';

      // Load testing standards
      const testingPath = path.join(standardsDir, 'testing-standards.md');
      if (await fileExists(testingPath)) {
        standards.testing = await fs.readFile(testingPath, 'utf-8');
      } else {
        standards.testing = 'No testing standards found. Run `sherpa add:standard --type testing` to create.';
      }

      // Load tech stack
      const techStackPath = path.join(standardsDir, 'tech-stack.md');
      if (await fileExists(techStackPath)) {
        standards.techstack = await fs.readFile(techStackPath, 'utf-8');
      } else {
        standards.techstack = 'No tech stack documented. Run `sherpa add:standard --type techstack` to create.';
      }

    } catch (error) {
      console.warn('Warning: Could not load standards:', error);
    }

    return standards;
  }

  private formatTestPlan(testPlan: { unit: string[], e2e: string[] }): string {
    const unit = testPlan.unit.map(test => `- **Unit**: ${test}`).join('\n');
    const e2e = testPlan.e2e.map(test => `- **E2E**: ${test}`).join('\n');
    return `${unit}\n${e2e}`;
  }

  private getRelevantFiles(patterns: any[]): string {
    const files = patterns.flatMap(p => p.files).filter((file, index, arr) => arr.indexOf(file) === index);
    return files.slice(0, 10).map(file => `- ${file}`).join('\n');
  }

  private formatPitfalls(pitfalls: any[]): string {
    return pitfalls.map(pitfall =>
      `### ${pitfall.pattern}\n- **Problem**: ${pitfall.description}\n- **Solution**: ${pitfall.solution}`
    ).join('\n\n');
  }

  private async getTemplates(): Promise<PromptTemplate[]> {
    const templates: PromptTemplate[] = [];
    const templateFiles = await fs.readdir(this.templatesPath);
    
    for (const file of templateFiles) {
      if (file.endsWith('.json')) {
        const template = await readJson<PromptTemplate>(path.join(this.templatesPath, file));
        templates.push(template);
      }
    }
    
    return templates;
  }

  private async savePromptVersion(templateId: string, content: string, ticket: Ticket): Promise<void> {
    const version: PromptVersion = {
      id: `${templateId}-${Date.now()}`,
      templateId,
      version: '1.0.0', // Could implement semantic versioning
      content,
      metadata: {
        createdAt: new Date().toISOString(),
        usedFor: ticket.ticket_id,
        outcome: 'success', // Will be updated based on feedback
        feedback: ''
      }
    };

    const versionPath = path.join(this.versionsPath, `${version.id}.json`);
    await writeJson(versionPath, version);
  }

  async recordPromptOutcome(versionId: string, outcome: 'success' | 'failure' | 'partial', feedback: string): Promise<void> {
    const versionPath = path.join(this.versionsPath, `${versionId}.json`);
    
    if (await fileExists(versionPath)) {
      const version = await readJson<PromptVersion>(versionPath);
      version.metadata.outcome = outcome;
      version.metadata.feedback = feedback;
      await writeJson(versionPath, version);

      // Update template performance
      await this.updateTemplatePerformance(version.templateId, outcome);
    }
  }

  private async updateTemplatePerformance(templateId: string, outcome: 'success' | 'failure' | 'partial'): Promise<void> {
    let performance: Record<string, PromptPerformance> = {};
    
    if (await fileExists(this.performancePath)) {
      performance = await readJson(this.performancePath);
    }

    if (!performance[templateId]) {
      performance[templateId] = {
        templateId,
        totalUses: 0,
        successCount: 0,
        failureCount: 0,
        averageRating: 0,
        commonIssues: [],
        lastAnalyzed: new Date().toISOString()
      };
    }

    const perf = performance[templateId];
    perf.totalUses++;
    
    if (outcome === 'success') {
      perf.successCount++;
    } else if (outcome === 'failure') {
      perf.failureCount++;
    }

    perf.lastAnalyzed = new Date().toISOString();
    perf.averageRating = perf.successCount / perf.totalUses;

    await writeJson(this.performancePath, performance);
  }

  async analyzePromptPerformance(): Promise<PromptPerformance[]> {
    if (await fileExists(this.performancePath)) {
      const performance = await readJson<Record<string, PromptPerformance>>(this.performancePath);
      return Object.values(performance);
    }
    return [];
  }

  async optimizePrompts(): Promise<void> {
    const performance = await this.analyzePromptPerformance();
    const templates = await this.getTemplates();

    for (const perf of performance) {
      if (perf.averageRating < 0.7 && perf.totalUses > 5) {
        // Template is underperforming, suggest optimizations
        console.log(`Template ${perf.templateId} has low success rate: ${(perf.averageRating * 100).toFixed(1)}%`);
        // TODO: Implement automatic template optimization based on failure patterns
      }
    }
  }
}