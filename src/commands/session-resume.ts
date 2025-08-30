import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { SessionManager } from '../utils/session.js';
import { getSherpaDir } from '../utils/fs.js';
import { promises as fs } from 'fs';
import * as path from 'path';

export const sessionResumeCommand = new Command('session:resume')
  .description('Resume work from a previous session handoff')
  .argument('[handoffId]', 'Specific handoff ID to resume from')
  .option('-l, --list', 'List available handoffs')
  .action(async (handoffId, options) => {
    try {
      const sessionManager = new SessionManager();
      
      if (options.list) {
        await listAvailableHandoffs();
        return;
      }
      
      // Check if there's already an active session
      const currentSession = await sessionManager.getCurrentSession();
      if (currentSession) {
        const { proceed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'proceed',
          message: 'There is already an active session. Do you want to complete it and start a new one?',
          default: false
        }]);
        
        if (!proceed) {
          console.log(chalk.yellow('❌ Resume cancelled. Complete current session first.'));
          return;
        }
        
        await sessionManager.completeSession('Session completed to resume from handoff');
        console.log(chalk.blue('✅ Previous session completed.'));
      }
      
      let selectedHandoffId = handoffId;
      
      if (!selectedHandoffId) {
        selectedHandoffId = await selectHandoff();
      }
      
      if (!selectedHandoffId) {
        console.log(chalk.yellow('❌ No handoff selected.'));
        return;
      }
      
      const spinner = ora('Resuming from handoff...').start();
      
      try {
        const session = await sessionManager.resumeFromHandoff(selectedHandoffId);
        
        spinner.succeed('Session resumed successfully!');
        
        console.log(chalk.green('\n✅ Session Resumed'));
        console.log(`📋 Session ID: ${session.id}`);
        console.log(`🎯 Task: ${session.currentTask}`);
        
        if (session.workingFiles.length > 0) {
          console.log(chalk.blue('\n📂 Working Files:'));
          session.workingFiles.forEach(file => {
            console.log(`   • ${file}`);
          });
        }
        
        // Show the handoff document for reference
        await showHandoffDocument(selectedHandoffId);
        
        console.log(chalk.green('\n🚀 Ready to continue! Use `sherpa session:log` to track progress.'));
        
      } catch (error) {
        spinner.fail('Failed to resume session');
        throw error;
      }
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

async function listAvailableHandoffs(): Promise<void> {
  const handoffsDir = path.join(getSherpaDir(), 'sessions', 'handoffs');
  
  try {
    const files = await fs.readdir(handoffsDir);
    const handoffs = files.filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
    
    if (handoffs.length === 0) {
      console.log(chalk.yellow('📭 No handoffs found. Create one with `sherpa handoff:prep`.'));
      return;
    }
    
    console.log(chalk.blue('📋 Available Handoffs:'));
    for (const handoff of handoffs.slice(0, 10)) { // Show latest 10
      console.log(`   • ${handoff}`);
    }
    
    console.log(chalk.gray(`\nFound ${handoffs.length} handoffs total.`));
    
  } catch (error) {
    console.log(chalk.yellow('📭 No handoffs directory found.'));
  }
}

async function selectHandoff(): Promise<string | null> {
  const handoffsDir = path.join(getSherpaDir(), 'sessions', 'handoffs');
  
  try {
    const files = await fs.readdir(handoffsDir);
    const handoffs = files
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''))
      .sort()
      .reverse(); // Most recent first
    
    if (handoffs.length === 0) {
      console.log(chalk.yellow('📭 No handoffs found. Create one with `sherpa handoff:prep`.'));
      return null;
    }
    
    const { selectedHandoff } = await inquirer.prompt([{
      type: 'list',
      name: 'selectedHandoff',
      message: 'Select handoff to resume from:',
      choices: handoffs.slice(0, 10).map(handoff => ({
        name: handoff,
        value: handoff
      })),
      pageSize: 10
    }]);
    
    return selectedHandoff;
    
  } catch (error) {
    console.log(chalk.yellow('📭 No handoffs directory found.'));
    return null;
  }
}

async function showHandoffDocument(handoffId: string): Promise<void> {
  const handoffPath = path.join(getSherpaDir(), 'sessions', 'handoffs', `${handoffId}.md`);
  
  try {
    const content = await fs.readFile(handoffPath, 'utf-8');
    const lines = content.split('\n');
    
    // Show a preview of the handoff document
    console.log(chalk.blue('\n📄 Handoff Context Preview:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    // Show first 15 lines
    lines.slice(0, 15).forEach(line => {
      if (line.startsWith('#')) {
        console.log(chalk.yellow(line));
      } else if (line.startsWith('*')) {
        console.log(chalk.gray(line));
      } else if (line.startsWith('-')) {
        console.log(chalk.cyan(line));
      } else if (line.trim()) {
        console.log(line);
      }
    });
    
    if (lines.length > 15) {
      console.log(chalk.gray(`\n... (${lines.length - 15} more lines)`));
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray(`📖 Full document: ${handoffPath}`));
    
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not load handoff document.'));
  }
}