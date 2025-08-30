import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ensureDir, writeJson, writeMarkdown, fileExists } from '../utils/fs.js';
import { formatDate } from '../utils/ids.js';
import { ContextManager } from '../utils/context.js';
import { PromptManager } from '../utils/prompts.js';
import { SessionManager } from '../utils/session.js';
import { hasGlobalSetup, getGlobalConfig, incrementProjectCount, showGlobalSetupPrompt, loadGlobalStandards } from '../utils/global-config.js';
import * as path from 'path';

export const initCommand = new Command('init')
  .description('Initialize Sherpa OS in the current project')
  .option('--force', 'Overwrite existing Sherpa configuration')
  .action(async (options) => {
    try {
      // Check for global setup first
      if (!await hasGlobalSetup()) {
        showGlobalSetupPrompt();
        return;
      }

      const spinner = ora('Initializing Sherpa OS...').start();
      
      const projectRoot = process.cwd();
      const sherpaDir = path.join(projectRoot, '.sherpa');
      
      // Check if already initialized
      if (await fileExists(sherpaDir) && !options.force) {
        spinner.fail('Sherpa OS already initialized');
        console.log(chalk.yellow('⚠️  Sherpa OS is already initialized in this project.'));
        console.log(chalk.gray('   Use --force to reinitialize.'));
        return;
      }
      
      // Get project information (simplified since we have global standards)
      spinner.stop();
      const globalConfig = await getGlobalConfig();
      const projectInfo = await gatherProjectInfo(globalConfig);
      spinner.start('Creating directory structure...');
      
      // Create directory structure
      await createDirectoryStructure(sherpaDir);
      
      spinner.text = 'Setting up configuration...';
      
      // Initialize configuration
      await createInitialConfig(sherpaDir, projectInfo);
      
      spinner.text = 'Initializing AI features...';
      
      // Initialize AI components
      await initializeAIFeatures();
      
      spinner.succeed('Sherpa OS initialized successfully!');
      
      // Show setup summary
      console.log(chalk.green('\n✅ Sherpa OS Setup Complete'));
      console.log(chalk.blue('\n📂 Directory Structure Created:'));
      console.log('   📁 .sherpa/');
      console.log('   ├── 📁 standards/     (coding & testing standards)');
      console.log('   ├── 📁 product/       (mission, roadmap, architecture)');
      console.log('   ├── 📁 specs/         (feature specifications)');
      console.log('   ├── 📁 backlog/       (epics, stories, tickets)');
      console.log('   ├── 📁 context/       (AI context & patterns)');
      console.log('   ├── 📁 prompts/       (AI prompt templates)');
      console.log('   ├── 📁 sessions/      (session continuity)');
      console.log('   └── 📄 state.json     (project state)');
      console.log('   📁 docs/');
      console.log('   ├── 📁 briefs/        (daily briefs)');
      console.log('   ├── 📁 retros/        (retrospectives)');
      console.log('   └── 📁 reports/       (velocity reports)');
      
      // Prompt user to set up standards
      console.log(chalk.blue('\n🔧 Setting up your development standards...'));
      const setupStandards = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'setupNow',
          message: 'Would you like to set up your coding standards and tech stack now?',
          default: true
        }
      ]);

      if (setupStandards.setupNow) {
        await setupInitialStandards(sherpaDir);
      }

      console.log(chalk.blue('\n🚀 Next Steps:'));
      if (!setupStandards.setupNow) {
        console.log('   1. Add coding standards: `sherpa add:standard`');
        console.log('   2. Add tech stack: `sherpa add:standard --type techstack`');
        console.log('   3. Create your first spec: `sherpa add:spec`');
      } else {
        console.log('   1. Create your first spec: `sherpa add:spec`');
      }
      console.log('   2. Build AI context: `sherpa context:build`');
      console.log('   3. Generate backlog: `sherpa gen:backlog`');
      console.log('   4. Create AI prompts: `sherpa gen:prompt`');
      
      console.log(chalk.gray('\n💡 Learn more: Check the generated README files in each directory'));
      
    } catch (error) {
      console.error(chalk.red(`Initialization failed: ${error}`));
      process.exit(1);
    }
  });

async function gatherProjectInfo(globalConfig: any): Promise<any> {
  console.log(chalk.blue('🔧 Project Setup'));
  console.log(chalk.gray(`Using global standards: ${globalConfig?.standards?.preset || 'custom'}\n`));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: path.basename(process.cwd()),
      validate: input => input.length > 0
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      validate: input => input.length > 0
    },
    {
      type: 'confirm',
      name: 'overrideStandards',
      message: 'Override global standards for this project?',
      default: false
    }
  ]);
  
  // Add global config info
  answers.globalConfig = globalConfig;
  answers.useGlobalStandards = !answers.overrideStandards;
  
  return answers;
}

async function createDirectoryStructure(sherpaDir: string): Promise<void> {
  // Main .sherpa directories
  await ensureDir(path.join(sherpaDir, 'standards'));
  await ensureDir(path.join(sherpaDir, 'product'));
  await ensureDir(path.join(sherpaDir, 'specs'));
  await ensureDir(path.join(sherpaDir, 'backlog'));
  await ensureDir(path.join(sherpaDir, 'context'));
  await ensureDir(path.join(sherpaDir, 'prompts', 'templates'));
  await ensureDir(path.join(sherpaDir, 'prompts', 'versions'));
  await ensureDir(path.join(sherpaDir, 'sessions', 'history'));
  await ensureDir(path.join(sherpaDir, 'sessions', 'handoffs'));
  
  // Documentation directories
  await ensureDir(path.join(process.cwd(), 'docs', 'briefs'));
  await ensureDir(path.join(process.cwd(), 'docs', 'retros'));
  await ensureDir(path.join(process.cwd(), 'docs', 'reports'));
}

async function createInitialConfig(sherpaDir: string, projectInfo: any): Promise<void> {
  // Create initial state
  const initialState = {
    initialized: true,
    initDate: new Date().toISOString(),
    projectName: projectInfo.projectName,
    description: projectInfo.description,
    techStack: projectInfo.techStackOther || projectInfo.techStack,
    aiEnabled: projectInfo.useAI,
    aiModel: projectInfo.aiModel,
    version: '0.1.0',
    lastBrief: null,
    lastRetro: null,
    ticketsCompleted: 0,
    currentSprint: null
  };
  
  await writeJson(path.join(sherpaDir, 'state.json'), initialState);
  
  // Create README files for each directory
  await createReadmeFiles(sherpaDir, projectInfo);
  
  // Create initial product documentation
  await createInitialProductDocs(sherpaDir, projectInfo);
}

async function createReadmeFiles(sherpaDir: string, projectInfo: any): Promise<void> {
  const readmes = [
    {
      path: path.join(sherpaDir, 'standards', 'README.md'),
      content: `# Coding Standards

Define your project's coding standards, testing practices, and quality gates here.

## Examples
- Code style preferences
- Testing requirements
- Performance standards
- Security guidelines
- Documentation standards

Use \`sherpa add:standard\` to add new standards.`
    },
    {
      path: path.join(sherpaDir, 'specs', 'README.md'),
      content: `# Feature Specifications

Store your feature specifications (SRDs, technical designs) here.

Each spec should include:
- Clear requirements
- Acceptance criteria
- Technical approach
- Dependencies
- Risk assessment

Use \`sherpa add:spec\` to add new specifications.`
    },
    {
      path: path.join(sherpaDir, 'backlog', 'README.md'),
      content: `# Project Backlog

Generated epics, stories, and tickets from your specifications.

Structure:
- \`epics/\` - High-level project goals
- \`stories/\` - User-focused requirements
- \`tickets/\` - Implementation tasks

Use \`sherpa gen:backlog\` to generate from specs.`
    },
    {
      path: path.join(sherpaDir, 'context', 'README.md'),
      content: `# AI Context

Compressed codebase knowledge for AI assistance.

Contains:
- \`patterns.md\` - Code patterns and conventions
- \`decisions.md\` - Architectural decisions
- \`pitfalls.md\` - Common mistakes to avoid
- \`compressed.json\` - AI-ready context data

Use \`sherpa context:build\` to update context.`
    }
  ];
  
  for (const readme of readmes) {
    await writeMarkdown(readme.path, readme.content);
  }
}

async function createInitialProductDocs(sherpaDir: string, projectInfo: any): Promise<void> {
  const missionDoc = `# ${projectInfo.projectName} - Mission

## Vision
${projectInfo.description}

## Tech Stack
${projectInfo.techStackOther || projectInfo.techStack}

## Goals
- [ ] Define initial goals here
- [ ] Add measurable objectives
- [ ] Set success criteria

## Architecture Principles
- [ ] Define key architectural decisions
- [ ] Document technology choices
- [ ] Establish patterns and conventions

*Created: ${formatDate()}*
*Update this document as your project evolves.*`;

  await writeMarkdown(path.join(sherpaDir, 'product', 'mission.md'), missionDoc);
  
  const roadmapDoc = `# ${projectInfo.projectName} - Roadmap

## Current Sprint
- No active sprint yet
- Use \`sherpa gen:backlog\` to create tickets

## Upcoming Features
- [ ] Define your feature roadmap here
- [ ] Prioritize development efforts
- [ ] Plan sprints and releases

## Technical Debt
- [ ] Document known technical debt
- [ ] Plan refactoring efforts
- [ ] Track improvements

*Created: ${formatDate()}*`;

  await writeMarkdown(path.join(sherpaDir, 'product', 'roadmap.md'), roadmapDoc);
}

async function setupInitialStandards(sherpaDir: string): Promise<void> {
  const standardsDir = path.join(sherpaDir, 'standards');
  
  // Quick setup with smart defaults
  console.log(chalk.blue('\n📝 Quick Standards Setup'));
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'preset',
      message: 'Choose a development preset:',
      choices: [
        { name: 'Full-Stack TypeScript (Next.js + Supabase + Vercel)', value: 'fullstack-ts' },
        { name: 'React Frontend (TypeScript + Tailwind)', value: 'react-frontend' },
        { name: 'Node.js Backend (Express + TypeScript)', value: 'node-backend' },
        { name: 'Python (FastAPI + PostgreSQL)', value: 'python-api' },
        { name: 'Custom (I will set this up manually)', value: 'custom' }
      ]
    }
  ]);

  if (answers.preset === 'custom') {
    console.log(chalk.yellow('💡 Run `sherpa add:standard` later to set up your custom standards'));
    return;
  }

  // Create preset-based standards
  await createPresetStandards(standardsDir, answers.preset);
}

async function createPresetStandards(standardsDir: string, preset: string): Promise<void> {
  const presets: Record<string, any> = {
    'fullstack-ts': {
      coding: {
        language: 'TypeScript',
        naming_convention: 'camelCase',
        file_structure: 'Next.js app directory structure',
        strict_types: true,
        formatting: 'Prettier + ESLint',
        import_style: 'Absolute paths with @/ alias',
        error_handling: 'Custom error classes + error boundaries',
        documentation: 'JSDoc for APIs + inline comments'
      },
      testing: {
        framework: 'Vitest + Testing Library',
        coverage_target: 80,
        test_structure: 'Co-located with .test.ts suffix',
        naming_pattern: 'Descriptive test names with describe/it',
        mocking_strategy: 'Mock external APIs, test business logic',
        e2e_tool: 'Playwright'
      },
      techstack: {
        frontend_framework: 'Next.js 14 (App Router)',
        backend_framework: 'Next.js API Routes',
        database: 'Supabase (PostgreSQL)',
        hosting_platform: 'Vercel',
        auth_service: 'Supabase Auth',
        styling: 'Tailwind CSS',
        state_management: 'Zustand + TanStack Query',
        api_client: 'TanStack Query + Supabase client',
        monitoring: 'Vercel Analytics + Sentry',
        ci_cd: 'GitHub Actions + Vercel'
      }
    },
    'react-frontend': {
      coding: {
        language: 'TypeScript',
        naming_convention: 'camelCase',
        file_structure: 'Feature-based folder structure',
        strict_types: true,
        formatting: 'Prettier + ESLint',
        import_style: 'Absolute paths with @/ alias',
        error_handling: 'Error boundaries + global error handler',
        documentation: 'JSDoc for components + Storybook'
      },
      testing: {
        framework: 'Vitest + React Testing Library',
        coverage_target: 85,
        test_structure: 'Co-located with component files',
        naming_pattern: 'BDD style test descriptions',
        mocking_strategy: 'Mock API calls, test component behavior',
        e2e_tool: 'Cypress'
      },
      techstack: {
        frontend_framework: 'React 18 + Vite',
        backend_framework: 'External API',
        database: 'Not applicable (frontend only)',
        hosting_platform: 'Netlify or Vercel',
        auth_service: 'Auth0 or Firebase Auth',
        styling: 'Tailwind CSS + HeadlessUI',
        state_management: 'Zustand + React Query',
        api_client: 'React Query + Axios',
        monitoring: 'LogRocket + Sentry',
        ci_cd: 'GitHub Actions'
      }
    },
    'node-backend': {
      coding: {
        language: 'TypeScript',
        naming_convention: 'camelCase',
        file_structure: 'Layered architecture (routes/services/models)',
        strict_types: true,
        formatting: 'Prettier + ESLint',
        import_style: 'Absolute paths from src/',
        error_handling: 'Custom error middleware + error classes',
        documentation: 'JSDoc + OpenAPI/Swagger'
      },
      testing: {
        framework: 'Jest + Supertest',
        coverage_target: 90,
        test_structure: 'Separate test directory',
        naming_pattern: 'Unit/Integration/E2E separation',
        mocking_strategy: 'Mock external services + database',
        e2e_tool: 'Newman (Postman) + Docker'
      },
      techstack: {
        frontend_framework: 'Not applicable (API only)',
        backend_framework: 'Express.js + TypeScript',
        database: 'PostgreSQL + Prisma ORM',
        hosting_platform: 'Railway or Heroku',
        auth_service: 'JWT + bcrypt',
        styling: 'Not applicable',
        state_management: 'Not applicable',
        api_client: 'Not applicable',
        monitoring: 'Winston + DataDog',
        ci_cd: 'GitHub Actions + Docker'
      }
    },
    'python-api': {
      coding: {
        language: 'Python',
        naming_convention: 'snake_case',
        file_structure: 'FastAPI project structure',
        strict_types: true,
        formatting: 'Black + isort + flake8',
        import_style: 'Absolute imports from app/',
        error_handling: 'Custom exception handlers',
        documentation: 'Docstrings + FastAPI auto docs'
      },
      testing: {
        framework: 'pytest + httpx',
        coverage_target: 85,
        test_structure: 'tests/ directory with mirrors',
        naming_pattern: 'test_* functions with descriptive names',
        mocking_strategy: 'pytest fixtures + mocks',
        e2e_tool: 'pytest + TestClient'
      },
      techstack: {
        frontend_framework: 'Not applicable (API only)',
        backend_framework: 'FastAPI + Pydantic',
        database: 'PostgreSQL + SQLAlchemy',
        hosting_platform: 'Heroku or Railway',
        auth_service: 'JWT + passlib',
        styling: 'Not applicable',
        state_management: 'Not applicable',
        api_client: 'Not applicable',
        monitoring: 'Loguru + Sentry',
        ci_cd: 'GitHub Actions + Docker'
      }
    }
  };

  const config = presets[preset];
  if (!config) return;

  console.log(chalk.green(`\n✅ Setting up ${preset} standards...`));

  // Create coding standards
  const codingContent = generateCodingStandardContent(config.coding);
  await writeMarkdown(path.join(standardsDir, 'coding-standards.md'), codingContent);

  // Create testing standards
  const testingContent = generateTestingStandardContent(config.testing);
  await writeMarkdown(path.join(standardsDir, 'testing-standards.md'), testingContent);

  // Create tech stack document
  const techStackContent = generateTechStackContent(config.techstack);
  await writeMarkdown(path.join(standardsDir, 'tech-stack.md'), techStackContent);

  console.log(chalk.green('   📄 Coding standards created'));
  console.log(chalk.green('   🧪 Testing standards created'));
  console.log(chalk.green('   🛠️ Tech stack documented'));
}

function generateCodingStandardContent(config: any): string {
  return `# Coding Standards

## Language & Syntax
- **Primary Language**: ${config.language}
- **Naming Convention**: ${config.naming_convention}
- **Strict Typing**: ${config.strict_types ? 'Enforced' : 'Optional'}

## File Organization
\`\`\`
${config.file_structure}
\`\`\`

## Code Formatting
- **Tools**: ${config.formatting}
- **Import Style**: ${config.import_style}

## Error Handling
\`\`\`
${config.error_handling}
\`\`\`

## Documentation
- **Style**: ${config.documentation}
- **Required For**: Public APIs, complex business logic, configuration

## Quality Gates
- All functions must have proper error handling
- No \`any\` types without justification
- Components should be single responsibility
- Use meaningful variable names (avoid abbreviations)

## AI Coding Guidelines
- Always include error boundaries for React components
- Prefer composition over inheritance
- Write tests alongside implementation
- Use TypeScript discriminated unions for state management
- Avoid over-abstraction - start concrete, abstract when needed

---
*Generated with Sherpa OS preset configuration*`;
}

function generateTestingStandardContent(config: any): string {
  return `# Testing Standards

## Framework & Tools
- **Unit Testing**: ${config.framework}
- **E2E Testing**: ${config.e2e_tool}
- **Coverage Target**: ${config.coverage_target}%

## Test Structure
- **File Organization**: ${config.test_structure}
- **Naming Pattern**: ${config.naming_pattern}

## Testing Strategy
\`\`\`
${config.mocking_strategy}
\`\`\`

## Test Categories

### Unit Tests
- Test individual functions/components in isolation
- Mock external dependencies
- Fast execution (< 1s per test suite)
- Cover edge cases and error conditions

### Integration Tests
- Test component interactions
- Use real implementations when possible
- Test API endpoints with test database

### E2E Tests
- Test critical user journeys
- Use production-like environment
- Focus on happy path + major error scenarios

## Quality Requirements
- All public functions must have unit tests
- New features require tests before merge
- Tests must be deterministic (no flaky tests)
- Test names should describe the expected behavior

## AI Testing Guidelines
- Always test error conditions (AI often forgets)
- Test with realistic data, not just happy path
- Include boundary value testing
- Mock external services consistently
- Write tests that document expected behavior

---
*Generated with Sherpa OS preset configuration*`;
}

function generateTechStackContent(config: any): string {
  return `# Tech Stack

## Core Stack
- **Frontend**: ${config.frontend_framework}
- **Backend**: ${config.backend_framework}
- **Database**: ${config.database}
- **Hosting**: ${config.hosting_platform}

## Authentication & Security
- **Auth Service**: ${config.auth_service}
- **Security Headers**: Configured via hosting platform
- **CORS**: Configured for production domains

## Frontend Technologies
- **Styling**: ${config.styling}
- **State Management**: ${config.state_management}
- **API Client**: ${config.api_client}
- **Form Handling**: React Hook Form + Zod validation

## Development Tools
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Testing**: Vitest + Playwright

## Deployment & DevOps
- **CI/CD**: ${config.ci_cd}
- **Monitoring**: ${config.monitoring}
- **Environment Management**: .env files + platform environment variables

## Architecture Patterns
- **API Routes**: RESTful design with proper HTTP status codes
- **Component Structure**: Atomic design principles
- **Error Handling**: Error boundaries + global error handling
- **Performance**: Code splitting, lazy loading, optimization

## AI Development Guidelines
- Use these technologies consistently across projects
- Don't introduce new dependencies without justification
- Follow established patterns from this stack
- Leverage platform-specific optimizations

---
*Generated with Sherpa OS preset configuration*`;
}

async function initializeAIFeatures(): Promise<void> {
  // Initialize context manager
  const contextManager = new ContextManager();
  // Context will be built when first used
  
  // Initialize prompt manager
  const promptManager = new PromptManager();
  await promptManager.initializePrompts();
  
  // Session manager is ready to use
  const sessionManager = new SessionManager();
  // Sessions are created on-demand
}