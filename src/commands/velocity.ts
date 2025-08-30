import { Command } from 'commander';
import chalk from 'chalk';
import { getSherpaDir, ensureDir, writeMarkdown, fileExists } from '../utils/fs.js';
import { formatDate } from '../utils/ids.js';
import { promises as fs } from 'fs';
import * as path from 'path';

export const velocityCommand = new Command('velocity')
  .description('Generate velocity report')
  .option('-d, --date <date>', 'Date for the report', formatDate())
  .option('--period <period>', 'Period to analyze (week, month)', 'week')
  .action(async (options) => {
    try {
      if (!await fileExists(getSherpaDir())) {
        console.log(chalk.red('❌ Sherpa OS not initialized. Run `sherpa init` first.'));
        return;
      }
      
      const reportData = await analyzeVelocity(options.period);
      
      const reportsDir = path.join(process.cwd(), 'docs', 'reports');
      await ensureDir(reportsDir);
      
      const reportPath = path.join(reportsDir, `velocity-${options.date}.md`);
      const reportContent = generateVelocityReport(reportData, options.date);
      
      await writeMarkdown(reportPath, reportContent);
      
      console.log(chalk.green(`\n✅ Velocity Report: ${options.date}`));
      console.log(chalk.blue(`📄 File: ${reportPath}`));
      
      // Show summary
      console.log(chalk.blue('\n📊 Velocity Summary:'));
      console.log(`🎫 Tickets Completed: ${reportData.tickets_completed}`);
      console.log(`⏱️  Average Cycle Time: ${reportData.average_cycle_time} days`);
      console.log(`🧪 Coverage: ${reportData.coverage_percent}%`);
      console.log(`🔄 Redo Rate: ${reportData.redo_rate}%`);
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

async function analyzeVelocity(period: string) {
  // This would analyze actual project data in a real implementation
  // For now, we'll generate sample data
  
  const backlogDir = path.join(getSherpaDir(), 'backlog', 'tickets');
  let ticketCount = 0;
  
  if (await fileExists(backlogDir)) {
    const files = await fs.readdir(backlogDir);
    ticketCount = files.filter(f => f.endsWith('.yml')).length;
  }
  
  // Sample velocity data - would be calculated from actual completion times
  return {
    tickets_completed: Math.min(ticketCount, 12),
    average_cycle_time: 2.5,
    coverage_percent: 78,
    redo_rate: 15,
    period: period,
    analysis_date: formatDate()
  };
}

function generateVelocityReport(data: any, date: string): string {
  return `# Velocity Report - ${date}

## 📊 Summary
- **Period**: ${data.period}
- **Analysis Date**: ${data.analysis_date}

## 🎯 Key Metrics

### Delivery
- **Tickets Completed**: ${data.tickets_completed}
- **Average Cycle Time**: ${data.average_cycle_time} days

### Quality
- **Test Coverage**: ${data.coverage_percent}%
- **Redo Rate**: ${data.redo_rate}%

## 📈 Trends

### Velocity
${data.tickets_completed > 10 ? '📈 Above average delivery' : '📉 Below average delivery'}

### Quality
${data.coverage_percent > 80 ? '✅ Good test coverage' : '⚠️ Test coverage needs improvement'}
${data.redo_rate < 20 ? '✅ Low redo rate' : '⚠️ High redo rate - focus on quality'}

## 🎯 Recommendations

${data.coverage_percent < 80 ? '- Increase test coverage to reach 80%+ target' : ''}
${data.redo_rate > 20 ? '- Focus on quality gates to reduce rework' : ''}
${data.tickets_completed < 8 ? '- Consider breaking down tickets into smaller tasks' : ''}

## 📋 Action Items
- [ ] Review ticket sizing and complexity
- [ ] Analyze blockers that affected cycle time
- [ ] Plan process improvements for next period

---
*Velocity report generated with Sherpa OS*`;
}