import { Command } from 'commander';
import chalk from 'chalk';
import { PromptManager } from '../utils/prompts.js';

export const promptOptimizeCommand = new Command('prompt:optimize')
  .description('Analyze and optimize prompt performance')
  .option('-v, --verbose', 'Show detailed analysis')
  .action(async (options) => {
    try {
      const promptManager = new PromptManager();
      const performance = await promptManager.analyzePromptPerformance();
      
      if (performance.length === 0) {
        console.log(chalk.yellow('⚠️  No prompt performance data found. Use prompts first to collect data.'));
        return;
      }
      
      console.log(chalk.blue('📊 Prompt Performance Analysis\n'));
      
      for (const perf of performance) {
        const successRate = (perf.averageRating * 100).toFixed(1);
        const statusColor = perf.averageRating >= 0.8 ? chalk.green : 
                          perf.averageRating >= 0.6 ? chalk.yellow : chalk.red;
        
        console.log(`${statusColor('●')} ${perf.templateId}`);
        console.log(`  Success Rate: ${statusColor(successRate + '%')} (${perf.successCount}/${perf.totalUses})`);
        console.log(`  Total Uses: ${perf.totalUses}`);
        console.log(`  Last Used: ${perf.lastAnalyzed}`);
        
        if (perf.commonIssues.length > 0) {
          console.log(`  Common Issues: ${perf.commonIssues.join(', ')}`);
        }
        
        console.log('');
      }
      
      // Suggest optimizations
      const underPerforming = performance.filter(p => p.averageRating < 0.7 && p.totalUses > 3);
      
      if (underPerforming.length > 0) {
        console.log(chalk.yellow('🔧 Optimization Suggestions:\n'));
        
        for (const perf of underPerforming) {
          console.log(`${chalk.yellow('⚠️')} ${perf.templateId}:`);
          console.log(`  - Success rate is only ${(perf.averageRating * 100).toFixed(1)}%`);
          console.log(`  - Consider revising the template structure`);
          console.log(`  - Add more specific context or constraints`);
          console.log(`  - Review failed prompt versions for patterns`);
          console.log('');
        }
      } else {
        console.log(chalk.green('✅ All prompts are performing well!'));
      }
      
      if (options.verbose) {
        console.log(chalk.gray('\n📈 Detailed Statistics:'));
        const totalUses = performance.reduce((sum, p) => sum + p.totalUses, 0);
        const totalSuccess = performance.reduce((sum, p) => sum + p.successCount, 0);
        const overallSuccessRate = totalUses > 0 ? (totalSuccess / totalUses * 100).toFixed(1) : '0';
        
        console.log(`Total Prompt Uses: ${totalUses}`);
        console.log(`Overall Success Rate: ${overallSuccessRate}%`);
        console.log(`Active Templates: ${performance.length}`);
      }
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });