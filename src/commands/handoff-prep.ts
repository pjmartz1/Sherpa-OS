import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { SessionManager } from '../utils/session.js';
import * as path from 'path';

export const handoffPrepCommand = new Command('handoff:prep')
  .description('Prepare comprehensive handoff context for next session')
  .option('-o, --output <file>', 'Output file for handoff document')
  .option('--complete', 'Mark session as complete after handoff')
  .action(async (options) => {
    const spinner = ora('Preparing handoff context...').start();
    
    try {
      const sessionManager = new SessionManager();
      const currentSession = await sessionManager.getCurrentSession();
      
      if (!currentSession) {
        spinner.fail('No active session found');
        console.log(chalk.yellow('⚠️  No active session to prepare handoff for.'));
        return;
      }
      
      spinner.text = 'Analyzing session data...';
      const handoff = await sessionManager.prepareHandoff();
      
      spinner.succeed('Handoff prepared successfully!');
      
      console.log(chalk.green('\n✅ Handoff Context Prepared'));
      console.log(chalk.blue('📋 Session Summary:'));
      console.log(`   ${handoff.summary}`);
      
      console.log(chalk.blue('\n📂 Working Files:'));
      handoff.relevantFiles.forEach(file => {
        console.log(`   • ${file}`);
      });
      
      console.log(chalk.blue('\n🎯 Next Actions:'));
      handoff.nextActions.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action}`);
      });
      
      if (handoff.troubleshootingNotes.length > 0) {
        console.log(chalk.blue('\n🔧 Troubleshooting Notes:'));
        handoff.troubleshootingNotes.forEach(note => {
          console.log(`   💡 ${note}`);
        });
      }
      
      if (handoff.aiPromptHistory.length > 0) {
        console.log(chalk.blue('\n🤖 Recent Successful AI Prompts:'));
        handoff.aiPromptHistory.forEach(prompt => {
          console.log(`   • ${prompt}`);
        });
      }
      
      const handoffId = `${handoff.sessionId}-${new Date().toISOString().split('T')[0]}`;
      console.log(chalk.gray(`\n📄 Handoff saved as: ${handoffId}`));
      console.log(chalk.gray(`📝 Resume with: sherpa session:resume ${handoffId}`));
      
      if (options.output) {
        // Copy handoff document to specified location
        console.log(chalk.gray(`📋 Custom output: ${options.output}`));
      }
      
      if (options.complete) {
        await sessionManager.completeSession('Session completed with handoff preparation');
        console.log(chalk.green('\n🏁 Session marked as complete'));
      } else {
        console.log(chalk.yellow('\n⏸️  Session remains active. Use --complete to finish.'));
      }
      
      // Show quick stats
      console.log(chalk.blue('\n📊 Session Stats:'));
      console.log(`   Duration: ${calculateDuration(currentSession.startTime)}`);
      console.log(`   Progress entries: ${currentSession.progress.length}`);
      console.log(`   Decisions made: ${currentSession.decisions.length}`);
      console.log(`   Blockers resolved: ${currentSession.blockers.filter(b => b.status === 'resolved').length}/${currentSession.blockers.length}`);
      console.log(`   AI interactions: ${currentSession.aiInteractions.length}`);
      
    } catch (error) {
      spinner.fail('Failed to prepare handoff');
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

function calculateDuration(startTime: string): string {
  const start = new Date(startTime);
  const now = new Date();
  const duration = now.getTime() - start.getTime();
  
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}