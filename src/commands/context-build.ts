import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ContextManager } from '../utils/context.js';
import { getSherpaRoot } from '../utils/fs.js';

export const contextBuildCommand = new Command('context:build')
  .description('Extract and build compressed context from codebase')
  .option('-v, --verbose', 'Show detailed progress')
  .action(async (options) => {
    const spinner = ora('Building context from codebase...').start();
    
    try {
      const projectRoot = getSherpaRoot();
      const contextManager = new ContextManager();
      
      spinner.text = 'Analyzing source files...';
      const context = await contextManager.buildContext(projectRoot);
      
      spinner.succeed('Context built successfully!');
      
      console.log(chalk.green('\n✅ Context Summary:'));
      console.log(`📁 Patterns extracted: ${context.patterns.length}`);
      console.log(`🏗️  Architectural decisions: ${context.decisions.length}`);
      console.log(`⚠️  Common pitfalls tracked: ${context.pitfalls.length}`);
      console.log(`🔍 Codebase fingerprint: ${context.codebaseFingerprint}`);
      
      if (options.verbose) {
        console.log(chalk.blue('\n📊 Top Patterns:'));
        context.patterns
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 5)
          .forEach(pattern => {
            console.log(`  • ${pattern.name} (${pattern.frequency}x)`);
          });
          
        console.log(chalk.blue('\n🏛️  Key Decisions:'));
        context.decisions.slice(0, 3).forEach(decision => {
          console.log(`  • ${decision.title}`);
        });
      }
      
      console.log(chalk.gray(`\n💡 Context saved to .sherpa/context/`));
      console.log(chalk.gray(`📖 Summary: ${context.summary}`));
      
    } catch (error) {
      spinner.fail('Failed to build context');
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });