import { Command } from 'commander';
import chalk from 'chalk';
import { ContextManager } from '../utils/context.js';
import { writeMarkdown } from '../utils/fs.js';
import * as path from 'path';

export const contextInjectCommand = new Command('context:inject')
  .description('Generate AI-ready context injection for current task')
  .option('-t, --task <task>', 'Specific task context to inject')
  .option('-f, --format <format>', 'Output format (markdown, json)', 'markdown')
  .option('-o, --output <file>', 'Output file path')
  .action(async (options) => {
    try {
      const contextManager = new ContextManager();
      const context = await contextManager.getCompressedContext();
      
      if (!context) {
        console.log(chalk.yellow('⚠️  No context found. Run `sherpa context:build` first.'));
        return;
      }
      
      let relevantContext;
      
      if (options.task) {
        console.log(chalk.blue(`🔍 Searching for context relevant to: "${options.task}"`));
        relevantContext = await contextManager.searchSimilarContext(options.task);
      } else {
        relevantContext = {
          patterns: context.patterns.slice(0, 10), // Top 10 patterns
          decisions: context.decisions
        };
      }
      
      const injectionContent = generateInjectionContent(context, relevantContext, options.task);
      
      if (options.output) {
        await writeMarkdown(options.output, injectionContent);
        console.log(chalk.green(`✅ Context injection saved to: ${options.output}`));
      } else {
        console.log(injectionContent);
      }
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

function generateInjectionContent(
  context: any, 
  relevantContext: { patterns: any[], decisions: any[] },
  task?: string
): string {
  const timestamp = new Date().toISOString();
  
  return `# AI Context Injection
*Generated: ${timestamp}*
${task ? `*Task: ${task}*` : ''}

## Codebase Summary
${context.summary}

## Key Patterns to Follow
${relevantContext.patterns.map(pattern => 
  `### ${pattern.name}
- **Usage**: ${pattern.frequency} times across ${pattern.files.length} files
- **Description**: ${pattern.description}
- **Example**: \`${pattern.example}\`
`).join('\n')}

## Architectural Constraints
${relevantContext.decisions.map(decision => 
  `### ${decision.title}
- **Decision**: ${decision.decision}
- **Rationale**: ${decision.rationale}
- **Impact**: ${decision.consequences.join(', ')}
`).join('\n')}

## Common Pitfalls to Avoid
${context.pitfalls.map((pitfall: any) => 
  `### ${pitfall.pattern}
- **Problem**: ${pitfall.description}
- **Solution**: ${pitfall.solution}
`).join('\n')}

## Context Rules
1. **Consistency**: Follow the established patterns shown above
2. **Error Handling**: Always include proper error handling (common AI oversight)
3. **Type Safety**: Use TypeScript types consistently throughout
4. **Testing**: Include test cases for all new functionality
5. **Documentation**: Follow existing documentation patterns

## Files to Reference
${relevantContext.patterns
  .flatMap(p => p.files)
  .filter((file, index, arr) => arr.indexOf(file) === index)
  .slice(0, 10)
  .map(file => `- ${file}`)
  .join('\n')}

---
*This context should be provided to your AI coding assistant along with your specific task requirements.*`;
}