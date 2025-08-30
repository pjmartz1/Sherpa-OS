import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileExists } from '../utils/fs.js';
import * as path from 'path';

const execAsync = promisify(exec);

export const testCommand = new Command('test')
  .description('Run tests and collect coverage')
  .option('--coverage', 'Run with coverage report', true)
  .option('--watch', 'Run tests in watch mode')
  .option('--filter <pattern>', 'Run tests matching pattern')
  .action(async (options) => {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      
      if (!await fileExists(packageJsonPath)) {
        console.log(chalk.red('❌ No package.json found. Are you in the right directory?'));
        return;
      }
      
      // Determine test command
      let testCommand = 'npm test';
      
      // Check if we have specific test runners
      if (await fileExists('vitest.config.ts') || await fileExists('vitest.config.js')) {
        testCommand = 'npx vitest run';
        if (options.coverage) {
          testCommand += ' --coverage';
        }
        if (options.watch) {
          testCommand = 'npx vitest';
        }
        if (options.filter) {
          testCommand += ` --reporter=verbose --grep="${options.filter}"`;
        }
      } else if (await fileExists('jest.config.js') || await fileExists('jest.config.ts')) {
        testCommand = 'npx jest';
        if (options.coverage) {
          testCommand += ' --coverage';
        }
        if (options.watch) {
          testCommand += ' --watch';
        }
        if (options.filter) {
          testCommand += ` --testNamePattern="${options.filter}"`;
        }
      }
      
      console.log(chalk.blue(`🧪 Running tests with: ${testCommand}`));
      
      const spinner = ora('Running tests...').start();
      
      try {
        const { stdout, stderr } = await execAsync(testCommand, {
          cwd: process.cwd(),
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        
        spinner.succeed('Tests completed!');
        
        console.log(stdout);
        if (stderr) {
          console.log(chalk.yellow('\nWarnings/Info:'));
          console.log(stderr);
        }
        
        // Parse test results for summary
        if (stdout.includes('✓') || stdout.includes('PASS')) {
          console.log(chalk.green('\n✅ Tests passed!'));
        }
        
        if (options.coverage && stdout.includes('%')) {
          console.log(chalk.blue('\n📊 Coverage Report Generated'));
          console.log(chalk.gray('   Check coverage/ directory for detailed report'));
        }
        
      } catch (error: any) {
        spinner.fail('Tests failed');
        
        console.log(chalk.red('\n❌ Test Failures:'));
        console.log(error.stdout || '');
        console.log(error.stderr || '');
        
        console.log(chalk.gray('\n💡 Tips:'));
        console.log(chalk.gray('   - Check test files for syntax errors'));
        console.log(chalk.gray('   - Ensure all dependencies are installed'));
        console.log(chalk.gray('   - Run tests individually to isolate issues'));
        
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });