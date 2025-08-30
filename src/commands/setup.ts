import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { promises as fs } from 'fs';
import { ensureDir, writeJson, writeMarkdown, fileExists } from '../utils/fs.js';
import * as path from 'path';
import * as os from 'os';

export const setupCommand = new Command('setup')
  .description('First-time global setup wizard for Sherpa OS')
  .option('--skip-tutorial', 'Skip the tutorial prompts')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🎉 Welcome to Sherpa OS!\n'));
      
      // Check if already set up
      const globalSherpaDir = getGlobalSherpaDir();
      if (await fileExists(globalSherpaDir) && !options.force) {
        console.log(chalk.yellow('⚠️  Global setup already completed.'));
        console.log(chalk.gray('   Use `sherpa config:edit` to modify your standards.'));
        console.log(chalk.gray('   Use `sherpa setup --force` to run setup again.'));
        return;
      }

      await showWelcomeMessage();
      const userLevel = await assessUserLevel();
      const standards = await setupGlobalStandards(userLevel);
      await createGlobalConfig(standards, userLevel);
      await showSetupSummary(standards);
      
      if (!options.skipTutorial) {
        await offerTutorial(userLevel);
      }

    } catch (error) {
      console.error(chalk.red(`Setup failed: ${error}`));
      process.exit(1);
    }
  });

function getGlobalSherpaDir(): string {
  return path.join(os.homedir(), '.sherpa');
}

async function showWelcomeMessage(): Promise<void> {
  console.log(chalk.blue(`Sherpa OS helps solo developers create consistent, high-quality code with AI assistance.

Here's how it works:
1. 📝 Write specs for features you want to build
2. 🎫 Generate tickets from your specs 
3. 🤖 Create AI-ready prompts with YOUR coding standards
4. 📊 Track progress with daily briefs and velocity reports

Let's set up your global coding standards (you only do this once!)\n`));
}

async function assessUserLevel(): Promise<'beginner' | 'experienced' | 'expert'> {
  const { level } = await inquirer.prompt([
    {
      type: 'list',
      name: 'level',
      message: '❓ How familiar are you with using AI for coding?',
      choices: [
        { name: 'New to AI coding - I need guidance', value: 'beginner' },
        { name: 'Some experience - I know the basics', value: 'experienced' },
        { name: 'Very experienced - Just show me the options', value: 'expert' }
      ]
    }
  ]);

  return level;
}

async function setupGlobalStandards(userLevel: string): Promise<any> {
  console.log(chalk.blue('\n🛠️ Let\'s set up your coding standards...\n'));

  if (userLevel === 'beginner') {
    console.log(chalk.gray('💡 These standards will be used in ALL your projects. You can change them later with `sherpa config:edit`\n'));
  }

  const { preset } = await inquirer.prompt([
    {
      type: 'list',
      name: 'preset',
      message: 'Choose your preferred development setup:',
      choices: [
        { name: '🚀 Full-Stack TypeScript (Next.js + Supabase + Vercel)', value: 'fullstack-ts' },
        { name: '⚛️ React Frontend (TypeScript + Tailwind)', value: 'react-frontend' },
        { name: '🏗️ Node.js Backend (Express + TypeScript)', value: 'node-backend' },
        { name: '🐍 Python API (FastAPI + PostgreSQL)', value: 'python-api' },
        { name: '🛠️ Custom - I\'ll configure this manually', value: 'custom' }
      ]
    }
  ]);

  const spinner = ora('Creating global standards...').start();
  
  const globalStandardsDir = path.join(getGlobalSherpaDir(), 'standards');
  await ensureDir(globalStandardsDir);

  if (preset === 'custom') {
    spinner.succeed('Setup ready for custom configuration');
    console.log(chalk.yellow('💡 Run `sherpa config:edit` after setup to configure your custom standards'));
    return { preset: 'custom', customized: false };
  }

  const standards = await createPresetStandards(globalStandardsDir, preset);
  spinner.succeed('Global standards created successfully!');
  
  return { preset, standards, customized: true };
}

async function createPresetStandards(standardsDir: string, preset: string): Promise<any> {
  const presets: Record<string, any> = {
    'fullstack-ts': {
      name: 'Full-Stack TypeScript',
      description: 'Next.js 14, Supabase, Vercel, Tailwind CSS',
      coding: 'TypeScript, camelCase, ESLint + Prettier',
      testing: 'Vitest + Playwright, 80% coverage',
      techStack: 'Next.js + Supabase + Vercel stack'
    },
    'react-frontend': {
      name: 'React Frontend',
      description: 'React 18, TypeScript, Tailwind, Vite',
      coding: 'TypeScript, camelCase, ESLint + Prettier',
      testing: 'Vitest + Testing Library, 85% coverage',
      techStack: 'React + Vite frontend stack'
    },
    'node-backend': {
      name: 'Node.js Backend',
      description: 'Express, TypeScript, PostgreSQL, Prisma',
      coding: 'TypeScript, camelCase, ESLint + Prettier',
      testing: 'Jest + Supertest, 90% coverage',
      techStack: 'Node.js + Express backend stack'
    },
    'python-api': {
      name: 'Python API',
      description: 'FastAPI, PostgreSQL, SQLAlchemy',
      coding: 'Python, snake_case, Black + flake8',
      testing: 'pytest + httpx, 85% coverage',
      techStack: 'FastAPI + PostgreSQL stack'
    }
  };

  const config = presets[preset];
  
  // Create the actual standard files (reuse existing logic)
  await createStandardsFiles(standardsDir, preset);
  
  return config;
}

async function createStandardsFiles(standardsDir: string, preset: string): Promise<void> {
  // This would reuse the logic from add-standard.ts createPresetStandards function
  // For now, creating simple versions
  
  const developmentStandards = `# Development Best Practices

## Core Principles
- Keep it simple and readable
- Follow DRY principles
- Comprehensive error handling
- Write tests alongside code

## AI Coding Guidelines  
- Use TypeScript for type safety
- Follow established naming conventions
- Implement proper error boundaries
- Write meaningful variable names

---
*Generated with Sherpa OS Global Setup*`;

  const techStack = `# Tech Stack

## Context
Global tech stack defaults for all Sherpa projects.

- App Framework: Next.js 14+
- Language: TypeScript 5.0+
- Primary Database: Supabase (PostgreSQL)
- Hosting: Vercel
- CSS Framework: Tailwind CSS
- State Management: Zustand + TanStack Query
- Testing: Vitest + Playwright

## AI Development Guidelines
- Use only technologies listed above
- Follow established patterns
- Prefer official packages

---
*Generated with Sherpa OS Global Setup*`;

  await writeMarkdown(path.join(standardsDir, 'development-best-practices.md'), developmentStandards);
  await writeMarkdown(path.join(standardsDir, 'tech-stack.md'), techStack);
}

async function createGlobalConfig(standards: any, userLevel: string): Promise<void> {
  const globalConfig = {
    version: '0.1.0',
    setupDate: new Date().toISOString(),
    userLevel: userLevel,
    standards: standards,
    defaultPreset: standards.preset,
    projectCount: 0,
    lastUsed: new Date().toISOString()
  };

  const configPath = path.join(getGlobalSherpaDir(), 'config.json');
  await writeJson(configPath, globalConfig);
}

async function showSetupSummary(standards: any): Promise<void> {
  console.log(chalk.green('\n✅ Your Global Standards Created!\n'));
  
  if (standards.customized) {
    console.log(chalk.blue('📄 Coding Standards: ') + standards.standards.coding);
    console.log(chalk.blue('🛠️ Tech Stack: ') + standards.standards.description);
    console.log(chalk.blue('🧪 Testing: ') + standards.standards.testing);
    console.log(chalk.gray(`\n📁 Standards saved to: ${path.join(getGlobalSherpaDir(), 'standards')}`));
    
    console.log(chalk.yellow('\n💡 Tip: AI assistants will now follow these exact standards in all your projects!'));
  } else {
    console.log(chalk.yellow('Custom setup ready - configure your standards with `sherpa config:edit`'));
  }
}

async function offerTutorial(userLevel: string): Promise<void> {
  if (userLevel === 'expert') {
    console.log(chalk.gray('\n🎓 Run `sherpa tutorial` anytime to see the workflow in action.'));
    return;
  }

  const { wantsTutorial } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'wantsTutorial',
      message: '\n🎓 Want a quick 2-minute tutorial on your first project?',
      default: userLevel === 'beginner'
    }
  ]);

  if (wantsTutorial) {
    console.log(chalk.blue('\n📚 Tutorial: Creating Your First Sherpa Project\n'));
    console.log(chalk.gray('1. Create a new project: ') + chalk.white('mkdir my-project && cd my-project'));
    console.log(chalk.gray('2. Initialize Sherpa: ') + chalk.white('sherpa init'));
    console.log(chalk.gray('3. Add a feature spec: ') + chalk.white('sherpa add:spec'));
    console.log(chalk.gray('4. Generate tickets: ') + chalk.white('sherpa gen:backlog'));
    console.log(chalk.gray('5. Create AI prompts: ') + chalk.white('sherpa gen:prompt'));
    
    console.log(chalk.yellow('\n💡 Your global standards will be automatically included in every AI prompt!'));
    console.log(chalk.gray('\n📖 Run `sherpa tutorial` anytime to see this again.'));
  }
}