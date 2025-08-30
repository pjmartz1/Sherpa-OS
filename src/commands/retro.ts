import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getSherpaDir, ensureDir, writeMarkdown } from '../utils/fs.js';
import { formatDate } from '../utils/ids.js';
import * as path from 'path';

export const retroCommand = new Command('retro')
  .description('Generate retrospective')
  .option('-d, --date <date>', 'Date for the retrospective', formatDate())
  .action(async (options) => {
    try {
      const retrospectiveData = await gatherRetrospectiveData(options.date);
      
      const retrosDir = path.join(process.cwd(), 'docs', 'retros');
      await ensureDir(retrosDir);
      
      const retroPath = path.join(retrosDir, `${options.date}.md`);
      const retroContent = generateRetroContent(retrospectiveData);
      
      await writeMarkdown(retroPath, retroContent);
      
      console.log(chalk.green(`\n✅ Retrospective: ${options.date}`));
      console.log(chalk.blue(`📄 File: ${retroPath}`));
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

async function gatherRetrospectiveData(date: string) {
  console.log(chalk.blue(`🔄 Retrospective for ${date}`));
  
  return await inquirer.prompt([
    {
      type: 'input',
      name: 'what_worked',
      message: 'What worked well this week? (comma-separated):',
      filter: (input: string) => input.split(',').map((item: string) => item.trim()).filter(Boolean)
    },
    {
      type: 'input',
      name: 'what_didnt',
      message: 'What didn\'t work well? (comma-separated):',
      filter: (input: string) => input.split(',').map((item: string) => item.trim()).filter(Boolean)
    },
    {
      type: 'input',
      name: 'actions',
      message: 'Action items for next week? (comma-separated):',
      filter: (input: string) => input.split(',').map((item: string) => item.trim()).filter(Boolean)
    },
    {
      type: 'input',
      name: 'efficiency_notes',
      message: 'Any efficiency improvements noted? (comma-separated):',
      filter: (input: string) => input.split(',').map((item: string) => item.trim()).filter(Boolean)
    }
  ]);
}

function generateRetroContent(data: any): string {
  return `# Weekly Retrospective - ${data.date || formatDate()}

## ✅ What Worked Well
${data.what_worked.map((item: string) => `- ${item}`).join('\n') || '- No items noted'}

## ❌ What Didn't Work
${data.what_didnt.map((item: string) => `- ${item}`).join('\n') || '- No issues noted'}

## 🎯 Action Items
${data.actions.map((item: string) => `- [ ] ${item}`).join('\n') || '- No actions identified'}

## 📈 Efficiency Notes
${data.efficiency_notes.map((item: string) => `- ${item}`).join('\n') || '- No efficiency notes'}

---
*Retrospective generated with Sherpa OS*`;
}