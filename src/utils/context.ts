import { promises as fs } from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import Fuse from 'fuse.js';
// import { distance } from 'natural';
import { getSherpaDir, ensureDir, writeJson, readJson, fileExists, writeMarkdown, readMarkdown } from './fs.js';

export interface CodePattern {
  id: string;
  name: string;
  description: string;
  example: string;
  frequency: number;
  files: string[];
  lastSeen: string;
}

export interface ArchitecturalDecision {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  consequences: string[];
  date: string;
  files: string[];
}

export interface CommonPitfall {
  id: string;
  pattern: string;
  description: string;
  solution: string;
  frequency: number;
  examples: string[];
}

export interface CompressedContext {
  patterns: CodePattern[];
  decisions: ArchitecturalDecision[];
  pitfalls: CommonPitfall[];
  summary: string;
  lastUpdated: string;
  codebaseFingerprint: string;
}

export class ContextManager {
  private contextDir: string;
  private patternsPath: string;
  private decisionsPath: string;
  private pitfallsPath: string;
  private compressedPath: string;

  constructor() {
    this.contextDir = path.join(getSherpaDir(), 'context');
    this.patternsPath = path.join(this.contextDir, 'patterns.md');
    this.decisionsPath = path.join(this.contextDir, 'decisions.md');
    this.pitfallsPath = path.join(this.contextDir, 'pitfalls.md');
    this.compressedPath = path.join(this.contextDir, 'compressed.json');
  }

  async buildContext(projectRoot: string): Promise<CompressedContext> {
    await ensureDir(this.contextDir);

    const patterns = await this.extractPatterns(projectRoot);
    const decisions = await this.extractDecisions(projectRoot);
    const pitfalls = await this.loadPitfalls();
    
    const summary = this.generateSummary(patterns, decisions, pitfalls);
    const fingerprint = await this.generateCodebaseFingerprint(projectRoot);

    const context: CompressedContext = {
      patterns,
      decisions,
      pitfalls,
      summary,
      lastUpdated: new Date().toISOString(),
      codebaseFingerprint: fingerprint
    };

    await writeJson(this.compressedPath, context);
    await this.savePatternsToMarkdown(patterns);
    await this.saveDecisionsToMarkdown(decisions);
    
    return context;
  }

  async extractPatterns(projectRoot: string): Promise<CodePattern[]> {
    const patterns: Map<string, CodePattern> = new Map();
    const files = await this.getSourceFiles(projectRoot);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const ast = parse(content, {
          sourceType: 'module',
          plugins: ['typescript', 'jsx']
        });

        traverse(ast, {
          FunctionDeclaration: (nodePath) => {
            this.extractFunctionPattern(nodePath, file, patterns);
          },
          ClassDeclaration: (nodePath) => {
            this.extractClassPattern(nodePath, file, patterns);
          },
          ImportDeclaration: (nodePath) => {
            this.extractImportPattern(nodePath, file, patterns);
          }
        });
      } catch (error) {
        console.warn(`Could not parse ${file}: ${error}`);
      }
    }

    return Array.from(patterns.values());
  }

  private extractFunctionPattern(nodePath: NodePath<t.FunctionDeclaration>, file: string, patterns: Map<string, CodePattern>): void {
    const node = nodePath.node;
    if (!node.id) return;

    const functionName = node.id.name;
    const params = node.params.length;
    const isAsync = node.async;
    const hasTypeAnnotations = node.params.some((p: any) => p.typeAnnotation);

    const patternId = `function-${params}-params-${isAsync ? 'async' : 'sync'}`;
    const existing = patterns.get(patternId);

    if (existing) {
      existing.frequency++;
      existing.files.push(file);
      existing.lastSeen = new Date().toISOString();
    } else {
      patterns.set(patternId, {
        id: patternId,
        name: `${isAsync ? 'Async' : 'Sync'} function with ${params} parameters`,
        description: `Functions with ${params} parameters, ${hasTypeAnnotations ? 'with' : 'without'} type annotations`,
        example: `function ${functionName}(${node.params.map((p: any) => p.type === 'Identifier' ? p.name : '...').join(', ')}) { ... }`,
        frequency: 1,
        files: [file],
        lastSeen: new Date().toISOString()
      });
    }
  }

  private extractClassPattern(nodePath: NodePath<t.ClassDeclaration>, file: string, patterns: Map<string, CodePattern>): void {
    const node = nodePath.node;
    if (!node.id) return;

    const className = node.id.name;
    const hasConstructor = node.body.body.some((member: any) => 
      t.isClassMethod(member) && member.kind === 'constructor'
    );
    const methodCount = node.body.body.filter((member: any) => 
      t.isClassMethod(member) && member.kind === 'method'
    ).length;

    const patternId = `class-${methodCount}-methods`;
    const existing = patterns.get(patternId);

    if (existing) {
      existing.frequency++;
      existing.files.push(file);
      existing.lastSeen = new Date().toISOString();
    } else {
      patterns.set(patternId, {
        id: patternId,
        name: `Class with ${methodCount} methods`,
        description: `Classes with ${methodCount} methods, ${hasConstructor ? 'with' : 'without'} constructor`,
        example: `class ${className} { ... }`,
        frequency: 1,
        files: [file],
        lastSeen: new Date().toISOString()
      });
    }
  }

  private extractImportPattern(nodePath: NodePath<t.ImportDeclaration>, file: string, patterns: Map<string, CodePattern>): void {
    const node = nodePath.node;
    const source = node.source.value;
    const isRelative = source.startsWith('./') || source.startsWith('../');
    const specifierCount = node.specifiers.length;
    const hasDefaultImport = node.specifiers.some((spec: any) => t.isImportDefaultSpecifier(spec));

    const patternId = `import-${isRelative ? 'relative' : 'package'}-${specifierCount}`;
    const existing = patterns.get(patternId);

    if (existing) {
      existing.frequency++;
      existing.files.push(file);
      existing.lastSeen = new Date().toISOString();
    } else {
      patterns.set(patternId, {
        id: patternId,
        name: `${isRelative ? 'Relative' : 'Package'} import with ${specifierCount} specifiers`,
        description: `Import from ${isRelative ? 'relative path' : 'npm package'} with ${specifierCount} specifiers, ${hasDefaultImport ? 'with' : 'without'} default import`,
        example: `import { ... } from '${source}';`,
        frequency: 1,
        files: [file],
        lastSeen: new Date().toISOString()
      });
    }
  }

  async extractDecisions(projectRoot: string): Promise<ArchitecturalDecision[]> {
    const decisions: ArchitecturalDecision[] = [];
    
    // Look for existing architectural decision records
    const adrPaths = [
      path.join(projectRoot, 'docs', 'adr'),
      path.join(projectRoot, 'docs', 'decisions'),
      path.join(projectRoot, '.adr-dir'),
      path.join(getSherpaDir(), 'decisions')
    ];

    for (const adrPath of adrPaths) {
      if (await fileExists(adrPath)) {
        const files = await fs.readdir(adrPath);
        for (const file of files) {
          if (file.endsWith('.md')) {
            const content = await readMarkdown(path.join(adrPath, file));
            const decision = this.parseArchitecturalDecision(content, file);
            if (decision) {
              decisions.push(decision);
            }
          }
        }
      }
    }

    // Extract implicit decisions from package.json and config files
    const implicitDecisions = await this.extractImplicitDecisions(projectRoot);
    decisions.push(...implicitDecisions);

    return decisions;
  }

  private parseArchitecturalDecision(content: string, filename: string): ArchitecturalDecision | null {
    const lines = content.split('\n');
    const title = lines.find(line => line.startsWith('# '))?.substring(2) || filename;
    
    // Simple extraction - in practice, you'd want more sophisticated parsing
    return {
      id: filename.replace('.md', ''),
      title,
      decision: content.substring(0, 200) + '...',
      rationale: 'Extracted from documentation',
      consequences: [],
      date: new Date().toISOString(),
      files: [filename]
    };
  }

  private async extractImplicitDecisions(projectRoot: string): Promise<ArchitecturalDecision[]> {
    const decisions: ArchitecturalDecision[] = [];
    
    // Check package.json for tech stack decisions
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (await fileExists(packageJsonPath)) {
      const packageJson = await readJson<any>(packageJsonPath);
      
      if (packageJson.dependencies?.react) {
        decisions.push({
          id: 'tech-stack-react',
          title: 'Use React for UI',
          decision: 'Chosen React as the UI framework',
          rationale: 'React provides component-based architecture and strong ecosystem',
          consequences: ['Need to manage component lifecycle', 'JSX syntax required'],
          date: new Date().toISOString(),
          files: ['package.json']
        });
      }

      if (packageJson.devDependencies?.typescript) {
        decisions.push({
          id: 'tech-stack-typescript',
          title: 'Use TypeScript',
          decision: 'Chosen TypeScript for type safety',
          rationale: 'TypeScript provides static type checking and better IDE support',
          consequences: ['Compilation step required', 'Learning curve for team'],
          date: new Date().toISOString(),
          files: ['package.json', 'tsconfig.json']
        });
      }
    }

    return decisions;
  }

  async loadPitfalls(): Promise<CommonPitfall[]> {
    // Load common AI pitfalls from configuration or previous learnings
    const defaultPitfalls: CommonPitfall[] = [
      {
        id: 'over-abstraction',
        pattern: 'Creating interfaces for single implementations',
        description: 'AI tends to create unnecessary abstractions',
        solution: 'Start concrete, abstract when you have 2+ implementations',
        frequency: 0,
        examples: []
      },
      {
        id: 'missing-error-handling',
        pattern: 'Functions without proper error handling',
        description: 'AI often skips comprehensive error handling',
        solution: 'Always handle edge cases and provide meaningful error messages',
        frequency: 0,
        examples: []
      }
    ];

    if (await fileExists(this.pitfallsPath)) {
      // TODO: Parse existing pitfalls from markdown
      return defaultPitfalls;
    }

    return defaultPitfalls;
  }

  private generateSummary(patterns: CodePattern[], decisions: ArchitecturalDecision[], pitfalls: CommonPitfall[]): string {
    const topPatterns = patterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5)
      .map(p => `${p.name} (used ${p.frequency} times)`)
      .join(', ');

    const keyDecisions = decisions
      .slice(0, 3)
      .map(d => d.title)
      .join(', ');

    return `This codebase primarily uses: ${topPatterns}. Key architectural decisions: ${keyDecisions}. Watch out for common pitfalls in AI-generated code.`;
  }

  private async generateCodebaseFingerprint(projectRoot: string): Promise<string> {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (await fileExists(packageJsonPath)) {
      const packageJson = await readJson<any>(packageJsonPath);
      const deps = Object.keys(packageJson.dependencies || {}).sort();
      const devDeps = Object.keys(packageJson.devDependencies || {}).sort();
      return `${deps.join(',')}|${devDeps.join(',')}`;
    }
    return 'unknown';
  }

  private async getSourceFiles(projectRoot: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    async function walkDir(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await walkDir(fullPath);
          } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }

    await walkDir(projectRoot);
    return files;
  }

  private async savePatternsToMarkdown(patterns: CodePattern[]): Promise<void> {
    const content = `# Code Patterns

${patterns.map(pattern => `
## ${pattern.name}

**Description:** ${pattern.description}  
**Frequency:** ${pattern.frequency} occurrences  
**Files:** ${pattern.files.length} files  
**Last Seen:** ${pattern.lastSeen}

\`\`\`
${pattern.example}
\`\`\`
`).join('\n')}`;

    await writeMarkdown(this.patternsPath, content);
  }

  private async saveDecisionsToMarkdown(decisions: ArchitecturalDecision[]): Promise<void> {
    const content = `# Architectural Decisions

${decisions.map(decision => `
## ${decision.title}

**Decision:** ${decision.decision}  
**Rationale:** ${decision.rationale}  
**Date:** ${decision.date}  
**Files:** ${decision.files.join(', ')}

**Consequences:**
${decision.consequences.map(c => `- ${c}`).join('\n')}
`).join('\n')}`;

    await writeMarkdown(this.decisionsPath, content);
  }

  async getCompressedContext(): Promise<CompressedContext | null> {
    if (await fileExists(this.compressedPath)) {
      return await readJson<CompressedContext>(this.compressedPath);
    }
    return null;
  }

  async searchSimilarContext(query: string): Promise<{ patterns: CodePattern[], decisions: ArchitecturalDecision[] }> {
    const context = await this.getCompressedContext();
    if (!context) {
      return { patterns: [], decisions: [] };
    }

    const patternFuse = new Fuse(context.patterns, {
      keys: ['name', 'description'],
      threshold: 0.6
    });

    const decisionFuse = new Fuse(context.decisions, {
      keys: ['title', 'decision', 'rationale'],
      threshold: 0.6
    });

    const patterns = patternFuse.search(query).map(result => result.item);
    const decisions = decisionFuse.search(query).map(result => result.item);

    return { patterns, decisions };
  }
}