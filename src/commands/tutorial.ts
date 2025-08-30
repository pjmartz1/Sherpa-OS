import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { hasGlobalSetup, getGlobalConfig } from '../utils/global-config.js';

export const tutorialCommand = new Command('tutorial')
  .description('Interactive tutorial for Sherpa OS workflow')
  .option('--quick', 'Show quick reference instead of interactive tutorial')
  .action(async (options) => {
    try {
      if (!await hasGlobalSetup()) {
        console.log(chalk.red('❌ Please run `sherpa setup` first to configure your global standards.'));
        return;
      }

      const globalConfig = await getGlobalConfig();
      const userLevel = globalConfig?.userLevel || 'experienced';

      if (options.quick) {
        showQuickReference();
        return;
      }

      await runInteractiveTutorial(userLevel);

    } catch (error) {
      console.error(chalk.red(`Tutorial failed: ${error}`));
      process.exit(1);
    }
  });

async function runInteractiveTutorial(userLevel: string): Promise<void> {
  console.log(chalk.blue('🎓 Sherpa OS Tutorial - Complete Workflow\n'));

  if (userLevel === 'beginner') {
    console.log(chalk.gray('This tutorial will walk you through the complete Sherpa workflow step by step.\n'));
  }

  const steps = [
    {
      step: 1,
      title: 'Initialize a New Project',
      command: 'sherpa init',
      description: 'Set up Sherpa in your project directory (uses global standards)',
      details: userLevel === 'beginner' ? 'This creates the .sherpa directory and project configuration.' : undefined
    },
    {
      step: 2,
      title: 'Create Feature Specifications',
      command: 'sherpa add:spec',
      description: 'Write detailed specifications for features you want to build',
      details: userLevel === 'beginner' ? 'Good specs include requirements, acceptance criteria, and technical details.' : undefined
    },
    {
      step: 3,
      title: 'Generate Development Backlog',
      command: 'sherpa gen:backlog',
      description: 'Convert specs into actionable tickets with estimates',
      details: userLevel === 'beginner' ? 'This creates epics, stories, and tickets from your specifications.' : undefined
    },
    {
      step: 4,
      title: 'Create AI-Ready Prompts',
      command: 'sherpa gen:prompt --context',
      description: 'Generate intelligent prompts with your coding standards',
      details: userLevel === 'beginner' ? 'These prompts include your standards, patterns, and context for consistent AI coding.' : undefined
    },
    {
      step: 5,
      title: 'Track Progress',
      command: 'sherpa brief / sherpa retro',
      description: 'Generate daily briefs and weekly retrospectives',
      details: userLevel === 'beginner' ? 'Keep track of your progress and improve your development process.' : undefined
    }
  ];

  for (const step of steps) {
    console.log(chalk.yellow(`\n📋 Step ${step.step}: ${step.title}`));
    console.log(chalk.white(`   Command: ${chalk.cyan(step.command)}`));
    console.log(`   ${step.description}`);
    
    if (step.details) {
      console.log(chalk.gray(`   💡 ${step.details}`));
    }

    if (userLevel === 'beginner') {
      const { continue: shouldContinue } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: 'Ready for the next step?',
          default: true
        }
      ]);
      
      if (!shouldContinue) {
        console.log(chalk.yellow('Tutorial paused. Run `sherpa tutorial` to continue anytime.'));
        return;
      }
    }
  }

  console.log(chalk.green('\n🎉 Tutorial Complete!\n'));
  
  const { nextAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'nextAction',
      message: 'What would you like to do next?',
      choices: [
        { name: 'Try the workflow in current directory', value: 'try-here' },
        { name: 'See example spec and prompt', value: 'show-example' },
        { name: 'Show quick reference card', value: 'quick-ref' },
        { name: 'Exit tutorial', value: 'exit' }
      ]
    }
  ]);

  switch (nextAction) {
    case 'try-here':
      await suggestTryWorkflow();
      break;
    case 'show-example':
      await showExampleWorkflow();
      break;
    case 'quick-ref':
      showQuickReference();
      break;
    default:
      console.log(chalk.blue('Happy coding with Sherpa OS! 🚀'));
  }
}

async function suggestTryWorkflow(): Promise<void> {
  console.log(chalk.blue('\n🚀 Ready to try the workflow?\n'));
  console.log('1. Make sure you\'re in a project directory');
  console.log('2. Run: ' + chalk.cyan('sherpa init'));
  console.log('3. Follow the prompts to set up your project');
  console.log('4. Then try: ' + chalk.cyan('sherpa add:spec') + ' to create your first spec');
  console.log(chalk.gray('\n💡 Your global standards will be automatically included!'));
}

async function showExampleWorkflow(): Promise<void> {
  console.log(chalk.blue('\n📝 Example: User Authentication Feature\n'));
  
  console.log(chalk.yellow('1. Spec Creation:'));
  console.log('   Title: User Authentication System');
  console.log('   Requirements: Registration, login, JWT tokens');
  console.log('   Acceptance Criteria: Secure password hashing, proper validation');

  console.log(chalk.yellow('\n2. Generated Ticket:'));
  console.log('   ticket_id: TKT-AUTH-001');
  console.log('   title: Implement user registration endpoint');
  console.log('   timebox_hours: 6');

  console.log(chalk.yellow('\n3. AI Prompt (includes your standards):'));
  console.log('   ✅ Your tech stack (Next.js, Supabase, TypeScript)');
  console.log('   ✅ Your coding standards (camelCase, error handling)');
  console.log('   ✅ Codebase context and patterns');
  console.log('   ✅ Anti-pattern warnings specific to AI');

  console.log(chalk.green('\n🎯 Result: Consistent code that follows YOUR exact standards!'));
}

function showQuickReference(): void {
  console.log(chalk.blue('\n📋 Sherpa OS Quick Reference\n'));
  
  const commands = [
    { cmd: 'sherpa setup', desc: 'One-time global setup (first install)' },
    { cmd: 'sherpa init', desc: 'Initialize project with global standards' },
    { cmd: 'sherpa add:spec', desc: 'Create feature specification' },
    { cmd: 'sherpa gen:backlog', desc: 'Generate tickets from specs' },
    { cmd: 'sherpa gen:prompt', desc: 'Create AI-ready prompts with context' },
    { cmd: 'sherpa brief', desc: 'Generate daily progress brief' },
    { cmd: 'sherpa retro', desc: 'Create weekly retrospective' },
    { cmd: 'sherpa velocity', desc: 'Generate velocity report' }
  ];

  commands.forEach(({ cmd, desc }) => {
    console.log(`${chalk.cyan(cmd.padEnd(20))} ${desc}`);
  });

  console.log(chalk.yellow('\n🔧 Configuration Commands:'));
  console.log(`${chalk.cyan('sherpa config:edit'.padEnd(20))} Edit global standards`);
  console.log(`${chalk.cyan('sherpa tutorial'.padEnd(20))} Show this tutorial again`);

  console.log(chalk.gray('\n💡 All commands use your global standards automatically!'));
}