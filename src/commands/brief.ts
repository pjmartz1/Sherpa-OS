import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { getSherpaDir, ensureDir, writeMarkdown, readJson, writeJson, fileExists } from '../utils/fs.js';
import { SessionManager } from '../utils/session.js';
import { formatDate } from '../utils/ids.js';
import { Brief } from '../types/index.js';
import * as path from 'path';

export const briefCommand = new Command('brief')
  .description('Generate daily brief')
  .option('-d, --date <date>', 'Date for the brief (YYYY-MM-DD)', formatDate())
  .option('--auto', 'Auto-generate brief from current session')
  .action(async (options) => {
    try {
      const briefsDir = path.join(process.cwd(), 'docs', 'briefs');
      
      if (!await fileExists(getSherpaDir())) {
        console.log(chalk.red('❌ Sherpa OS not initialized. Run `sherpa init` first.'));
        return;
      }
      
      await ensureDir(briefsDir);
      
      const briefDate = options.date;
      const briefPath = path.join(briefsDir, `${briefDate}.md`);
      
      let briefData: Brief;
      
      if (options.auto) {
        briefData = await generateAutoBrief(briefDate);
      } else {
        briefData = await generateInteractiveBrief(briefDate);
      }
      
      const spinner = ora('Generating brief...').start();
      
      // Generate brief content
      const briefContent = generateBriefContent(briefData);
      
      // Save brief
      await writeMarkdown(briefPath, briefContent);
      
      // Update state
      await updateProjectState(briefDate);
      
      spinner.succeed('Brief generated successfully!');
      
      console.log(chalk.green(`\n✅ Daily Brief: ${briefDate}`));
      console.log(chalk.blue(`📄 File: ${briefPath}`));
      
      // Show brief summary
      console.log(chalk.blue('\n📋 Brief Summary:'));
      console.log(`📈 Progress: ${briefData.progress.length} items`);
      console.log(`🚫 Blockers: ${briefData.blockers.length} items`);
      console.log(`🎯 Next Actions: ${briefData.next_actions.length} items`);
      console.log(`🧪 Test Coverage: ${briefData.test_status.coverage_percent}%`);
      
      if (briefData.blockers.length > 0) {
        console.log(chalk.red('\n⚠️  Active Blockers:'));
        briefData.blockers.forEach(blocker => {
          console.log(`   • ${blocker}`);
        });
      }
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

async function generateAutoBrief(date: string): Promise<Brief> {
  const sessionManager = new SessionManager();
  const currentSession = await sessionManager.getCurrentSession();
  
  if (!currentSession) {
    console.log(chalk.yellow('⚠️  No active session found. Generating basic brief.'));
    
    return {
      date,
      progress: ['No active session tracked'],
      blockers: [],
      next_actions: ['Start tracking work with session commands'],
      test_status: {
        coverage_percent: 0,
        tests_passing: false
      }
    };
  }
  
  // Extract information from current session
  const progress = currentSession.progress.map(p => `${p.milestone}: ${p.description}`);
  const blockers = currentSession.blockers
    .filter(b => b.status === 'open')
    .map(b => `[${b.severity}] ${b.description}`);
  
  const nextActions = [];
  
  // Generate next actions based on blockers and progress
  if (blockers.length > 0) {
    nextActions.push('Resolve current blockers');
  }
  
  const recentProgress = currentSession.progress.slice(-1)[0];
  if (recentProgress) {
    if (recentProgress.testStatus === 'failing') {
      nextActions.push('Fix failing tests');
    } else if (recentProgress.testStatus === 'none') {
      nextActions.push('Add test coverage');
    }
  }
  
  if (nextActions.length === 0) {
    nextActions.push('Continue current development work');
  }
  
  return {
    date,
    progress,
    blockers,
    next_actions: nextActions,
    test_status: {
      coverage_percent: 75, // Would be calculated from actual test results
      tests_passing: recentProgress?.testStatus === 'complete'
    }
  };
}

async function generateInteractiveBrief(date: string): Promise<Brief> {
  console.log(chalk.blue(`📝 Daily Brief for ${date}`));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'progress',
      message: 'What did you accomplish today? (comma-separated):',
      filter: (input: string) => input.split(',').map((item: string) => item.trim()).filter(Boolean)
    },
    {
      type: 'input',
      name: 'blockers',
      message: 'Any blockers or issues? (comma-separated):',
      filter: (input: string) => input.split(',').map((item: string) => item.trim()).filter(Boolean)
    },
    {
      type: 'input',
      name: 'next_actions',
      message: 'Top 3 priorities for tomorrow? (comma-separated):',
      validate: (input: string) => {
        const items = input.split(',').filter(Boolean);
        return items.length > 0 ? true : 'Please enter at least one priority';
      },
      filter: (input: string) => input.split(',').map((item: string) => item.trim()).filter(Boolean)
    },
    {
      type: 'number',
      name: 'coverage_percent',
      message: 'Current test coverage percentage (0-100):',
      default: 0,
      validate: (input: number) => input >= 0 && input <= 100
    },
    {
      type: 'confirm',
      name: 'tests_passing',
      message: 'Are all tests currently passing?',
      default: false
    }
  ]);
  
  return {
    date,
    progress: answers.progress,
    blockers: answers.blockers,
    next_actions: answers.next_actions,
    test_status: {
      coverage_percent: answers.coverage_percent,
      tests_passing: answers.tests_passing
    }
  };
}

function generateBriefContent(brief: Brief): string {
  return `# Daily Brief - ${brief.date}

## 📈 Progress Made
${brief.progress.map(item => `- ${item}`).join('\n') || '- No progress logged'}

## 🚫 Blockers & Issues
${brief.blockers.length > 0 
  ? brief.blockers.map(item => `- ${item}`).join('\n')
  : '- No blockers reported'
}

## 🎯 Next Actions
${brief.next_actions.map(item => `- [ ] ${item}`).join('\n')}

## 🧪 Test Status
- **Coverage**: ${brief.test_status.coverage_percent}%
- **Tests Passing**: ${brief.test_status.tests_passing ? '✅ Yes' : '❌ No'}

## 📊 Metrics
- Progress Items: ${brief.progress.length}
- Active Blockers: ${brief.blockers.length}
- Planned Actions: ${brief.next_actions.length}

---
*Brief generated with Sherpa OS on ${new Date().toISOString().split('T')[0]}*`;
}

async function updateProjectState(briefDate: string): Promise<void> {
  const statePath = path.join(getSherpaDir(), 'state.json');
  
  let state: any = {};
  if (await fileExists(statePath)) {
    state = await readJson(statePath);
  }
  
  state.last_brief = briefDate;
  await writeJson(statePath, state);
}