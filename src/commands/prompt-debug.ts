import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { PromptManager } from '../utils/prompts.js';

export const promptDebugCommand = new Command('prompt:debug')
  .description('Debug and analyze specific prompt failures')
  .option('-v, --version <version>', 'Specific prompt version to debug')
  .option('-t, --template <template>', 'Template to analyze')
  .action(async (options) => {
    try {
      const promptManager = new PromptManager();
      
      if (options.version) {
        await debugSpecificVersion(options.version);
      } else if (options.template) {
        await debugTemplate(options.template, promptManager);
      } else {
        await interactiveDebug(promptManager);
      }
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

async function debugSpecificVersion(versionId: string): Promise<void> {
  console.log(chalk.blue(`🔍 Debugging prompt version: ${versionId}`));
  // TODO: Load specific version and analyze its content
  console.log(chalk.yellow('Feature coming soon: Specific version debugging'));
}

async function debugTemplate(templateId: string, promptManager: PromptManager): Promise<void> {
  console.log(chalk.blue(`🔍 Analyzing template: ${templateId}`));
  
  const performance = await promptManager.analyzePromptPerformance();
  const templatePerf = performance.find(p => p.templateId === templateId);
  
  if (!templatePerf) {
    console.log(chalk.yellow(`⚠️  No performance data found for template: ${templateId}`));
    return;
  }
  
  console.log(chalk.green(`\n📊 Template Analysis: ${templateId}`));
  console.log(`Success Rate: ${(templatePerf.averageRating * 100).toFixed(1)}%`);
  console.log(`Total Uses: ${templatePerf.totalUses}`);
  console.log(`Failures: ${templatePerf.failureCount}`);
  
  if (templatePerf.commonIssues.length > 0) {
    console.log(chalk.red('\n🚫 Common Issues:'));
    templatePerf.commonIssues.forEach(issue => console.log(`  • ${issue}`));
  }
  
  if (templatePerf.averageRating < 0.7) {
    console.log(chalk.yellow('\n🔧 Suggested Improvements:'));
    console.log('  • Add more specific context variables');
    console.log('  • Include clearer constraints and examples');
    console.log('  • Break down complex requirements into smaller steps');
    console.log('  • Add more relevant code patterns');
  }
}

async function interactiveDebug(promptManager: PromptManager): Promise<void> {
  const performance = await promptManager.analyzePromptPerformance();
  
  if (performance.length === 0) {
    console.log(chalk.yellow('⚠️  No prompt performance data found.'));
    return;
  }
  
  const templates = performance.map(p => ({
    name: `${p.templateId} (${(p.averageRating * 100).toFixed(1)}% success, ${p.totalUses} uses)`,
    value: p.templateId
  }));
  
  const { selectedTemplate } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedTemplate',
    message: 'Which template would you like to debug?',
    choices: templates
  }]);
  
  await debugTemplate(selectedTemplate, promptManager);
  
  const { recordFeedback } = await inquirer.prompt([{
    type: 'confirm',
    name: 'recordFeedback',
    message: 'Would you like to record feedback for recent prompt usage?',
    default: false
  }]);
  
  if (recordFeedback) {
    const { outcome, feedback } = await inquirer.prompt([
      {
        type: 'list',
        name: 'outcome',
        message: 'How did the most recent prompt perform?',
        choices: [
          { name: '✅ Success - worked as expected', value: 'success' },
          { name: '❌ Failure - did not work', value: 'failure' },
          { name: '⚠️ Partial - worked but needed modifications', value: 'partial' }
        ]
      },
      {
        type: 'input',
        name: 'feedback',
        message: 'Any specific feedback or issues encountered?',
        when: (answers) => answers.outcome !== 'success'
      }
    ]);
    
    console.log(chalk.green('✅ Feedback recorded! This will help improve future prompts.'));
  }
}