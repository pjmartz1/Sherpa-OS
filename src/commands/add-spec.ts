import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { getSherpaDir, ensureDir, writeMarkdown, fileExists } from '../utils/fs.js';
import { formatDate } from '../utils/ids.js';
import * as path from 'path';

export const addSpecCommand = new Command('add:spec')
  .description('Add feature specification')
  .option('-f, --file <file>', 'Spec file name')
  .option('-t, --title <title>', 'Spec title')
  .option('--template <type>', 'Spec template (feature, api, improvement)', 'feature')
  .action(async (options) => {
    try {
      const specsDir = path.join(getSherpaDir(), 'specs');
      
      if (!await fileExists(getSherpaDir())) {
        console.log(chalk.red('❌ Sherpa OS not initialized. Run `sherpa init` first.'));
        return;
      }
      
      await ensureDir(specsDir);
      
      // Get spec details
      let specData;
      if (options.title && options.file) {
        specData = {
          title: options.title,
          filename: options.file.endsWith('.md') ? options.file : `${options.file}.md`,
          template: options.template
        };
      } else {
        specData = await gatherSpecInfo(options);
      }
      
      const spinner = ora('Creating specification...').start();
      
      // Create the spec file
      const specPath = path.join(specsDir, specData.filename);
      
      if (await fileExists(specPath)) {
        spinner.fail('Specification file already exists');
        console.log(chalk.yellow(`⚠️  File already exists: ${specData.filename}`));
        console.log(chalk.gray(`   Use a different name or edit the existing file.`));
        return;
      }
      
      const specContent = generateSpecTemplate(specData, options.template);
      await writeMarkdown(specPath, specContent);
      
      spinner.succeed('Specification created successfully!');
      
      console.log(chalk.green(`\n✅ Spec Created: ${specData.title}`));
      console.log(chalk.blue(`📄 File: ${specPath}`));
      console.log(chalk.gray(`\n💡 Next steps:`));
      console.log(chalk.gray(`   1. Edit the spec file to add details`));
      console.log(chalk.gray(`   2. Run \`sherpa review:spec\` to validate requirements`));
      console.log(chalk.gray(`   3. Run \`sherpa gen:backlog\` to create tickets`));
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

async function gatherSpecInfo(options: any): Promise<any> {
  console.log(chalk.blue('📝 New Feature Specification'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'title',
      message: 'Specification title:',
      validate: input => input.length > 0
    },
    {
      type: 'input',
      name: 'filename',
      message: 'File name:',
      default: (answers: any) => answers.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '.md',
      validate: input => input.length > 0
    },
    {
      type: 'list',
      name: 'template',
      message: 'Specification type:',
      default: options.template || 'feature',
      choices: [
        { name: '🚀 New Feature - Complete new functionality', value: 'feature' },
        { name: '🔧 API Specification - Backend/API changes', value: 'api' },
        { name: '📈 Improvement - Enhancement to existing feature', value: 'improvement' },
        { name: '🐛 Bug Fix Specification - Complex bug resolution', value: 'bugfix' },
        { name: '📚 Documentation - Documentation updates', value: 'docs' }
      ]
    },
    {
      type: 'input',
      name: 'priority',
      message: 'Priority (high, medium, low):',
      default: 'medium',
      validate: input => ['high', 'medium', 'low'].includes(input.toLowerCase())
    },
    {
      type: 'input',
      name: 'effort',
      message: 'Estimated effort (hours):',
      default: '8',
      validate: input => !isNaN(parseInt(input)) && parseInt(input) > 0
    }
  ]);
  
  return answers;
}

function generateSpecTemplate(specData: any, templateType: string): string {
  const date = formatDate();
  const baseTemplate = `# ${specData.title}

**Status**: Draft  
**Priority**: ${specData.priority || 'Medium'}  
**Effort**: ${specData.effort || '8'} hours  
**Created**: ${date}  
**Type**: ${templateType}

## Overview
Brief description of what this specification covers and why it's needed.

## Problem Statement
What problem are we solving? What pain points does this address?

## Goals
- [ ] Primary goal 1
- [ ] Primary goal 2
- [ ] Secondary goal 3

## Non-Goals
- What are we explicitly NOT doing
- What is out of scope for this specification

## Requirements

### Functional Requirements
1. **FR-001**: The system must...
2. **FR-002**: The user should be able to...
3. **FR-003**: The feature will support...

### Non-Functional Requirements
1. **NFR-001**: Performance requirements
2. **NFR-002**: Security requirements
3. **NFR-003**: Scalability requirements

## User Stories
- **As a** [user type] **I want** [functionality] **so that** [benefit]
- **As a** [user type] **I want** [functionality] **so that** [benefit]

## Acceptance Criteria
- [ ] **AC-001**: Given [context] When [action] Then [outcome]
- [ ] **AC-002**: Given [context] When [action] Then [outcome]
- [ ] **AC-003**: Given [context] When [action] Then [outcome]

${getTemplateSpecificSections(templateType)}

## Technical Approach
Brief outline of the technical implementation approach.

## API Changes
\`\`\`
// List any API changes needed
GET /api/new-endpoint
POST /api/existing-endpoint (modified)
\`\`\`

## Database Changes
\`\`\`sql
-- List any database schema changes
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);
\`\`\`

## UI/UX Changes
- Describe UI components that need to be created/modified
- Include wireframes or mockups if available

## Dependencies
- External dependencies
- Internal system dependencies
- Third-party integrations

## Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|-------------|---------|------------|
| Risk 1 | Medium | High | Mitigation strategy |
| Risk 2 | Low | Medium | Mitigation strategy |

## Testing Strategy
- **Unit Tests**: What unit tests are needed
- **Integration Tests**: What integration scenarios to test
- **E2E Tests**: What end-to-end flows to validate
- **Performance Tests**: What performance benchmarks to meet

## Success Metrics
- How will we measure success?
- What KPIs/metrics will we track?
- Definition of done

## Implementation Plan
1. **Phase 1**: Initial implementation
2. **Phase 2**: Additional features
3. **Phase 3**: Polish and optimization

## Questions & Assumptions
- [ ] Question 1 that needs to be answered
- [ ] Question 2 that needs clarification
- [ ] Assumption 1 we're making
- [ ] Assumption 2 we're making

## Review Notes
_Use this section for review feedback and decisions_

---
*Specification created with Sherpa OS - ${date}*`;

  return baseTemplate;
}

function getTemplateSpecificSections(templateType: string): string {
  switch (templateType) {
    case 'api':
      return `
## API Specification

### Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET    | /api/resource | Get resource | Yes |
| POST   | /api/resource | Create resource | Yes |

### Request/Response Examples
\`\`\`json
// POST /api/resource
{
  "field1": "value1",
  "field2": "value2"
}

// Response
{
  "id": 123,
  "field1": "value1",
  "status": "created"
}
\`\`\`

### Error Handling
| Status Code | Description | Response Format |
|-------------|-------------|-----------------|
| 400 | Bad Request | {"error": "message"} |
| 401 | Unauthorized | {"error": "auth required"} |
`;
    
    case 'improvement':
      return `
## Current State Analysis
- What currently exists
- What are the limitations
- Performance/usability issues

## Proposed Changes
- Specific improvements to be made
- Expected impact of changes
- Migration strategy if needed
`;
    
    case 'bugfix':
      return `
## Bug Description
- Current behavior
- Expected behavior
- Steps to reproduce
- Impact assessment

## Root Cause Analysis
- What is causing the issue
- How did this bug occur
- Related systems affected

## Fix Strategy
- Approach to fix the issue
- Alternative solutions considered
- Rollback plan if needed
`;
    
    default:
      return '';
  }
}