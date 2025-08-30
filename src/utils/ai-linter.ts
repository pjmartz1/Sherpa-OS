import { promises as fs } from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { getSherpaRoot, fileExists } from './fs.js';
import { CodePattern } from './context.js';

export interface AILintRule {
  id: string;
  name: string;
  description: string;
  category: 'over-abstraction' | 'error-handling' | 'security' | 'consistency' | 'performance';
  severity: 'error' | 'warning' | 'info';
  check: (node: t.Node, context: LintContext) => AILintIssue | null;
}

export interface AILintIssue {
  ruleId: string;
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface LintContext {
  filename: string;
  sourceCode: string;
  patterns: CodePattern[];
  existingInterfaces: Set<string>;
  existingClasses: Set<string>;
}

export class AILinter {
  private rules: AILintRule[];

  constructor() {
    this.rules = this.getDefaultRules();
  }

  async lintFile(filePath: string): Promise<AILintIssue[]> {
    const issues: AILintIssue[] = [];
    
    if (!await fileExists(filePath)) {
      return issues;
    }

    const sourceCode = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath);
    
    // Only lint JavaScript/TypeScript files
    if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
      return issues;
    }

    try {
      const ast = parse(sourceCode, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      });

      const context: LintContext = {
        filename: filePath,
        sourceCode,
        patterns: [], // Would be populated from context manager
        existingInterfaces: new Set(),
        existingClasses: new Set()
      };

      // First pass: collect interfaces and classes
      traverse(ast, {
        TSInterfaceDeclaration: (nodePath) => {
          if (nodePath.node.id.name) {
            context.existingInterfaces.add(nodePath.node.id.name);
          }
        },
        ClassDeclaration: (nodePath) => {
          if (nodePath.node.id?.name) {
            context.existingClasses.add(nodePath.node.id.name);
          }
        }
      });

      // Second pass: apply lint rules
      traverse(ast, {
        enter: (nodePath) => {
          for (const rule of this.rules) {
            const issue = rule.check(nodePath.node, context);
            if (issue && nodePath.node.loc) {
              issues.push({
                ...issue,
                line: nodePath.node.loc.start.line,
                column: nodePath.node.loc.start.column
              });
            }
          }
        }
      });

    } catch (error) {
      console.warn(`Could not parse ${filePath}: ${error}`);
    }

    return issues;
  }

  async lintProject(): Promise<Record<string, AILintIssue[]>> {
    const results: Record<string, AILintIssue[]> = {};
    const projectRoot = getSherpaRoot();
    const files = await this.getSourceFiles(projectRoot);

    for (const file of files) {
      const issues = await this.lintFile(file);
      if (issues.length > 0) {
        results[file] = issues;
      }
    }

    return results;
  }

  private getDefaultRules(): AILintRule[] {
    return [
      {
        id: 'no-single-use-interface',
        name: 'No Single-Use Interface',
        description: 'Avoid creating interfaces that are only used once',
        category: 'over-abstraction',
        severity: 'warning',
        check: (node, context) => {
          if (t.isTSInterfaceDeclaration(node) && node.id.name) {
            // Simple heuristic: if interface name suggests it's for a single component
            const interfaceName = node.id.name;
            if (interfaceName.endsWith('Props') || interfaceName.endsWith('State')) {
              // Check if it's overly complex for a single-use interface
              if (node.body.body.length > 10) {
                return {
                  ruleId: 'no-single-use-interface',
                  message: `Interface '${interfaceName}' is complex and may be over-abstraction. Consider using inline types or breaking it down.`,
                  line: 0,
                  column: 0,
                  severity: 'warning',
                  suggestion: 'Consider using inline type definitions or breaking into smaller interfaces'
                };
              }
            }
          }
          return null;
        }
      },
      {
        id: 'missing-error-handling',
        name: 'Missing Error Handling',
        description: 'Functions should include proper error handling',
        category: 'error-handling',
        severity: 'error',
        check: (node, context) => {
          if ((t.isFunctionDeclaration(node) || t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) && node.async) {
            // Check if async function has try-catch
            const hasErrorHandling = this.hasErrorHandling(node.body);
            if (!hasErrorHandling) {
              return {
                ruleId: 'missing-error-handling',
                message: 'Async function missing error handling. Consider adding try-catch block.',
                line: 0,
                column: 0,
                severity: 'error',
                suggestion: 'Wrap async operations in try-catch blocks'
              };
            }
          }
          return null;
        }
      },
      {
        id: 'avoid-any-type',
        name: 'Avoid Any Type',
        description: 'Avoid using "any" type - be more specific',
        category: 'consistency',
        severity: 'warning',
        check: (node, context) => {
          if (t.isTSAnyKeyword(node)) {
            return {
              ruleId: 'avoid-any-type',
              message: 'Avoid using "any" type. Use specific types for better type safety.',
              line: 0,
              column: 0,
              severity: 'warning',
              suggestion: 'Define specific types or use unknown if needed'
            };
          }
          return null;
        }
      },
      {
        id: 'no-unused-generic',
        name: 'No Unused Generic',
        description: 'Generic type parameters should be used',
        category: 'over-abstraction',
        severity: 'warning',
        check: (node, context) => {
          if (t.isTSTypeParameterDeclaration(node)) {
            // This is a simplified check - would need more sophisticated analysis
            return null; // TODO: Implement proper generic usage checking
          }
          return null;
        }
      },
      {
        id: 'hardcoded-secrets',
        name: 'No Hardcoded Secrets',
        description: 'Detect potential hardcoded secrets or API keys',
        category: 'security',
        severity: 'error',
        check: (node, context) => {
          if (t.isStringLiteral(node)) {
            const value = node.value;
            // Simple patterns for detecting potential secrets
            const secretPatterns = [
              /^sk-[a-zA-Z0-9]{32,}$/, // API keys starting with sk-
              /^[A-Za-z0-9]{32,}$/, // Long alphanumeric strings
              /password.*=.*['""][^'""]+['""]/, // Password assignments
              /token.*=.*['""][^'""]+['""]/, // Token assignments
            ];

            for (const pattern of secretPatterns) {
              if (pattern.test(value) && value.length > 20) {
                return {
                  ruleId: 'hardcoded-secrets',
                  message: 'Potential hardcoded secret detected. Use environment variables instead.',
                  line: 0,
                  column: 0,
                  severity: 'error',
                  suggestion: 'Move sensitive data to environment variables'
                };
              }
            }
          }
          return null;
        }
      },
      {
        id: 'inefficient-array-ops',
        name: 'Inefficient Array Operations',
        description: 'Detect potentially inefficient array operations',
        category: 'performance',
        severity: 'info',
        check: (node, context) => {
          // Check for nested array operations that could be optimized
          if (t.isCallExpression(node) && 
              t.isMemberExpression(node.callee) && 
              t.isIdentifier(node.callee.property)) {
            
            const methodName = node.callee.property.name;
            if (['map', 'filter', 'reduce'].includes(methodName)) {
              // Check if this is chained with another array operation
              if (t.isMemberExpression(node.callee.object) && 
                  t.isCallExpression(node.callee.object)) {
                
                return {
                  ruleId: 'inefficient-array-ops',
                  message: 'Consider combining array operations to avoid multiple iterations.',
                  line: 0,
                  column: 0,
                  severity: 'info',
                  suggestion: 'Combine multiple array operations or use a single loop'
                };
              }
            }
          }
          return null;
        }
      }
    ];
  }

  private hasErrorHandling(node: any): boolean {
    if (!node || !node.body) return false;
    
    // Check if function body contains try-catch
    if (t.isBlockStatement(node)) {
      return node.body.some(stmt => t.isTryStatement(stmt));
    }
    
    return false;
  }

  private async getSourceFiles(projectRoot: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    async function walkDir(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && 
              entry.name !== 'node_modules' && entry.name !== 'dist') {
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

  formatResults(results: Record<string, AILintIssue[]>): string {
    let output = '';
    let totalIssues = 0;
    let totalFiles = Object.keys(results).length;

    for (const [file, issues] of Object.entries(results)) {
      totalIssues += issues.length;
      output += `\n📄 ${path.relative(getSherpaRoot(), file)}\n`;
      
      issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : 
                    issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        output += `  ${icon} Line ${issue.line}: ${issue.message}\n`;
        if (issue.suggestion) {
          output += `     💡 ${issue.suggestion}\n`;
        }
      });
    }

    if (totalIssues === 0) {
      return '✅ No AI-specific issues found!';
    }

    return `🔍 AI Code Quality Report\n` +
           `Found ${totalIssues} issues across ${totalFiles} files:\n` +
           output +
           `\n📊 Summary:\n` +
           `   Errors: ${totalIssues}  Files: ${totalFiles}`;
  }
}