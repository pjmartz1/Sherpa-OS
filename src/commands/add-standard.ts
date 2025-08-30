import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { getSherpaDir, ensureDir, writeMarkdown, fileExists } from '../utils/fs.js';
import * as path from 'path';

export const addStandardCommand = new Command('add:standard')
  .description('Add coding/testing standard')
  .option('-t, --type <type>', 'Type of standard (coding, testing, techstack)', 'coding')
  .action(async (options) => {
    try {
      if (!await fileExists(getSherpaDir())) {
        console.log(chalk.red('❌ Sherpa OS not initialized. Run `sherpa init` first.'));
        return;
      }

      const standardsDir = path.join(getSherpaDir(), 'standards');
      await ensureDir(standardsDir);

      if (options.type === 'techstack') {
        await createTechStackDocument(standardsDir);
      } else if (options.type === 'testing') {
        await createTestingStandard(standardsDir);
      } else {
        await createCodingStandard(standardsDir);
      }

    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

async function createCodingStandard(standardsDir: string): Promise<void> {
  console.log(chalk.blue('📝 Creating Coding Standards'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'language',
      message: 'Primary programming language:',
      default: 'TypeScript'
    },
    {
      type: 'input',
      name: 'naming_convention',
      message: 'Naming convention (camelCase, snake_case, PascalCase):',
      default: 'camelCase'
    },
    {
      type: 'input',
      name: 'file_structure',
      message: 'Preferred file/folder structure pattern:',
      default: 'feature-based (components, utils, types per feature)'
    },
    {
      type: 'confirm',
      name: 'strict_types',
      message: 'Enforce strict typing?',
      default: true
    },
    {
      type: 'input',
      name: 'formatting',
      message: 'Code formatting tool (prettier, eslint, etc.):',
      default: 'prettier + eslint'
    },
    {
      type: 'input',
      name: 'import_style',
      message: 'Import organization style:',
      default: 'absolute paths, group by external/internal'
    },
    {
      type: 'input',
      name: 'error_handling',
      message: 'Error handling approach:',
      default: 'try/catch with custom error classes'
    },
    {
      type: 'input',
      name: 'documentation',
      message: 'Documentation style (JSDoc, inline comments, etc.):',
      default: 'JSDoc for public APIs, inline for complex logic'
    }
  ]);

  // Create modular standards files
  await createDevelopmentBestPractices(standardsDir);
  await createCodeStyleGuide(standardsDir, answers);
  await createLanguageSpecificStandards(standardsDir, answers);
  
  console.log(chalk.green(`✅ Modular coding standards created`));
  console.log(chalk.blue(`   📄 Development best practices`));
  console.log(chalk.blue(`   🎨 Code style guide`));
  console.log(chalk.blue(`   🔧 ${answers.language} specific standards`));
}

async function createDevelopmentBestPractices(standardsDir: string): Promise<void> {
  const content = `# Development Best Practices

## Context

Global development guidelines for ${process.cwd().split(path.sep).pop()} projects.

<conditional-block context-check="core-principles">
IF this Core Principles section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using Core Principles already in context"
ELSE:
  READ: The following principles

## Core Principles

### Keep It Simple
- Implement code in the fewest lines possible
- Avoid over-engineering solutions
- Choose straightforward approaches over clever ones

### Optimize for Readability
- Prioritize code clarity over micro-optimizations
- Write self-documenting code with clear variable names
- Add comments for "why" not "what"

### DRY (Don't Repeat Yourself)
- Extract repeated business logic to private methods
- Extract repeated UI markup to reusable components
- Create utility functions for common operations

### File Structure
- Keep files focused on a single responsibility
- Group related functionality together
- Use consistent naming conventions
</conditional-block>

<conditional-block context-check="dependencies" task-condition="choosing-external-library">
IF current task involves choosing an external library:
  IF Dependencies section already read in current context:
    SKIP: Re-reading this section
    NOTE: "Using Dependencies guidelines already in context"
  ELSE:
    READ: The following guidelines
ELSE:
  SKIP: Dependencies section not relevant to current task

## Dependencies

### Choose Libraries Wisely
When adding third-party dependencies:
- Select the most popular and actively maintained option
- Check the library's GitHub repository for:
  - Recent commits (within last 6 months)
  - Active issue resolution
  - Number of stars/downloads
  - Clear documentation

### AI Development Guidelines
- Prefer established libraries over custom implementations
- Use TypeScript-first libraries when available
- Check bundle size impact before adding dependencies
- Document why specific libraries were chosen
</conditional-block>

## Error Handling

### Comprehensive Error Management
- Always handle potential failure cases
- Use custom error classes for different error types
- Provide meaningful error messages to users
- Log errors with sufficient context for debugging

### AI Common Pitfalls
- Don't assume API calls will always succeed
- Handle network timeouts and connectivity issues
- Validate user input before processing
- Use error boundaries in React applications

---
*Generated with Sherpa OS*`;

  await writeMarkdown(path.join(standardsDir, 'development-best-practices.md'), content);
}

async function createCodeStyleGuide(standardsDir: string, config: any): Promise<void> {
  const content = `# Code Style Guide

## Context

Global code style rules for ${process.cwd().split(path.sep).pop()} projects.

<conditional-block context-check="general-formatting">
IF this General Formatting section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using General Formatting rules already in context"
ELSE:
  READ: The following formatting rules

## General Formatting

### Indentation
- Use 2 spaces for indentation (never tabs)
- Maintain consistent indentation throughout files
- Align nested structures for readability

### Naming Conventions
- **Methods and Variables**: Use ${config.naming_convention}
- **Classes and Modules**: Use PascalCase
- **Constants**: Use UPPER_SNAKE_CASE
- **Files**: Use kebab-case for file names

### String Formatting
- Use single quotes for strings: \`'Hello World'\`
- Use double quotes only when interpolation is needed
- Use template literals for multi-line strings or complex interpolation

### Code Comments
- Add brief comments above non-obvious business logic
- Document complex algorithms or calculations
- Explain the "why" behind implementation choices
- Never remove existing comments unless removing the associated code
- Update comments when modifying code to maintain accuracy
- Keep comments concise and relevant
</conditional-block>

<conditional-block task-condition="typescript" context-check="typescript-style">
IF current task involves writing or updating TypeScript:
  IF TypeScript style rules already in context:
    SKIP: Re-reading this section
    NOTE: "Using TypeScript style guide already in context"
  ELSE:
    READ: The following TypeScript rules

## TypeScript Specific

### Type Definitions
- Always define explicit return types for functions
- Use interfaces for object shapes, types for unions/primitives
- Prefer \`unknown\` over \`any\` when type is truly unknown
- Use generic constraints to make types more specific

### Import/Export Style
- ${config.import_style}
- Group imports: external libraries first, then internal modules
- Use named exports over default exports for better tree-shaking
</conditional-block>

<conditional-block task-condition="react" context-check="react-style">
IF current task involves writing or updating React components:
  IF React style rules already in context:
    SKIP: Re-reading this section
    NOTE: "Using React style guide already in context"
  ELSE:
    READ: The following React rules

## React Specific

### Component Structure
- Use functional components with hooks
- Keep components under 200 lines when possible
- Extract custom hooks for reusable stateful logic
- Use meaningful prop names and add PropTypes/TypeScript definitions

### Performance
- Use React.memo for expensive renders
- Implement proper dependency arrays in useEffect
- Avoid creating objects/functions in render methods
</conditional-block>

---
*Generated with Sherpa OS*`;

  await writeMarkdown(path.join(standardsDir, 'code-style-guide.md'), content);
}

async function createLanguageSpecificStandards(standardsDir: string, config: any): Promise<void> {
  const language = config.language.toLowerCase();
  
  let content = `# ${config.language} Standards

## Context

${config.language}-specific development guidelines.

<conditional-block context-check="${language}-standards">
IF this ${config.language} Standards section already read in current context:
  SKIP: Re-reading this section
  NOTE: "Using ${config.language} standards already in context"
ELSE:
  READ: The following ${config.language} guidelines
`;

  if (language.includes('typescript') || language.includes('javascript')) {
    content += `
## TypeScript/JavaScript Standards

### Type Safety
- ${config.strict_types ? 'Enforce strict typing with no implicit any' : 'Use TypeScript but allow gradual adoption'}
- Use union types instead of generic \`object\` types
- Implement proper error handling with typed exceptions

### Module System
- Use ES6+ module syntax (import/export)
- Organize code into logical modules
- Use barrel exports for clean public APIs

### Async Programming
- Prefer async/await over Promise chains
- Handle errors in async functions properly
- Use Promise.all() for parallel operations

### Performance Considerations
- Use lazy loading for large components/modules
- Implement proper memoization where needed
- Avoid unnecessary re-renders in React applications
`;
  }

  content += `
## Formatting & Tools
- **Formatter**: ${config.formatting}
- **Documentation**: ${config.documentation}

## Error Handling Strategy
\`\`\`
${config.error_handling}
\`\`\`

## AI Development Guidelines for ${config.language}
- Follow established patterns from the ecosystem
- Use official documentation as the primary reference
- Implement comprehensive error boundaries
- Write tests alongside implementation
- Avoid over-abstraction in initial implementations

</conditional-block>

---
*Generated with Sherpa OS*`;

  await writeMarkdown(path.join(standardsDir, `${language}-standards.md`), content);
}

async function createTestingStandard(standardsDir: string): Promise<void> {
  console.log(chalk.blue('🧪 Creating Testing Standards'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'framework',
      message: 'Testing framework (Jest, Vitest, Mocha, etc.):',
      default: 'Vitest'
    },
    {
      type: 'number',
      name: 'coverage_target',
      message: 'Target code coverage percentage:',
      default: 80
    },
    {
      type: 'input',
      name: 'test_structure',
      message: 'Test file structure (co-located, separate folder):',
      default: 'co-located with .test.ts suffix'
    },
    {
      type: 'input',
      name: 'naming_pattern',
      message: 'Test naming pattern:',
      default: 'describe + it blocks, descriptive test names'
    },
    {
      type: 'input',
      name: 'mocking_strategy',
      message: 'Mocking strategy:',
      default: 'Mock external dependencies, test real business logic'
    },
    {
      type: 'input',
      name: 'e2e_tool',
      message: 'E2E testing tool (Playwright, Cypress, etc.):',
      default: 'Playwright'
    }
  ]);

  const testingContent = `# Testing Standards

## Framework & Tools
- **Unit Testing**: ${answers.framework}
- **E2E Testing**: ${answers.e2e_tool}
- **Coverage Target**: ${answers.coverage_target}%

## Test Structure
- **File Organization**: ${answers.test_structure}
- **Naming Pattern**: ${answers.naming_pattern}

## Testing Strategy
\`\`\`
${answers.mocking_strategy}
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
*Generated with Sherpa OS*`;

  const filePath = path.join(standardsDir, 'testing-standards.md');
  await writeMarkdown(filePath, testingContent);
  
  console.log(chalk.green(`✅ Testing standards created: ${filePath}`));
}

async function createTechStackDocument(standardsDir: string): Promise<void> {
  console.log(chalk.blue('🛠️ Creating Tech Stack Document'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'frontend_framework',
      message: 'Frontend framework:',
      default: 'Next.js'
    },
    {
      type: 'input',
      name: 'backend_framework',
      message: 'Backend framework/runtime:',
      default: 'Node.js + Express'
    },
    {
      type: 'input',
      name: 'database',
      message: 'Database:',
      default: 'Supabase (PostgreSQL)'
    },
    {
      type: 'input',
      name: 'hosting_platform',
      message: 'Hosting platform:',
      default: 'Vercel'
    },
    {
      type: 'input',
      name: 'auth_service',
      message: 'Authentication service:',
      default: 'Supabase Auth'
    },
    {
      type: 'input',
      name: 'styling',
      message: 'Styling solution:',
      default: 'Tailwind CSS'
    },
    {
      type: 'input',
      name: 'state_management',
      message: 'State management:',
      default: 'Zustand'
    },
    {
      type: 'input',
      name: 'api_client',
      message: 'API client:',
      default: 'TanStack Query + Axios'
    },
    {
      type: 'input',
      name: 'monitoring',
      message: 'Monitoring/Analytics:',
      default: 'Vercel Analytics + Sentry'
    },
    {
      type: 'input',
      name: 'ci_cd',
      message: 'CI/CD:',
      default: 'GitHub Actions'
    }
  ]);

  const techStackContent = `# Tech Stack

## Core Stack
- **Frontend**: ${answers.frontend_framework}
- **Backend**: ${answers.backend_framework}
- **Database**: ${answers.database}
- **Hosting**: ${answers.hosting_platform}

## Authentication & Security
- **Auth Service**: ${answers.auth_service}
- **Security Headers**: Configured via hosting platform
- **CORS**: Configured for production domains

## Frontend Technologies
- **Styling**: ${answers.styling}
- **State Management**: ${answers.state_management}
- **API Client**: ${answers.api_client}
- **Form Handling**: React Hook Form + Zod validation

## Development Tools
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Testing**: Vitest + Playwright

## Deployment & DevOps
- **CI/CD**: ${answers.ci_cd}
- **Monitoring**: ${answers.monitoring}
- **Environment Management**: .env files + platform environment variables

## Preferred Libraries

### UI Components
- Headless UI or Radix UI primitives
- Heroicons for icons
- Framer Motion for animations

### Utilities
- date-fns for date manipulation
- lodash-es for utilities (tree-shakable)
- clsx for conditional classNames

### Data Validation
- Zod for schema validation
- TypeScript for compile-time type safety

## Architecture Patterns
- **API Routes**: RESTful design with proper HTTP status codes
- **Component Structure**: Atomic design principles
- **Error Handling**: Error boundaries + global error handling
- **Performance**: Code splitting, lazy loading, image optimization

## AI Development Guidelines
- Use these technologies consistently across projects
- Don't introduce new dependencies without justification
- Follow established patterns from this stack
- Leverage platform-specific optimizations (Vercel, Supabase features)

---
*Generated with Sherpa OS*`;

  const filePath = path.join(standardsDir, 'tech-stack.md');
  await writeMarkdown(filePath, techStackContent);
  
  console.log(chalk.green(`✅ Tech stack document created: ${filePath}`));
}