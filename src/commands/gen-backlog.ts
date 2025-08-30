import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { promises as fs } from 'fs';
import { getSherpaDir, ensureDir, writeYaml, readMarkdown, fileExists } from '../utils/fs.js';
import { generateTicketId, generateEpicId, generateStoryId } from '../utils/ids.js';
import { Ticket, Epic, Story } from '../types/index.js';
import * as path from 'path';

export const genBacklogCommand = new Command('gen:backlog')
  .description('Generate backlog from specifications')
  .option('-s, --spec <spec>', 'Specific spec file to process')
  .option('-f, --force', 'Overwrite existing backlog items')
  .option('--dry-run', 'Show what would be generated without creating files')
  .action(async (options) => {
    try {
      const specsDir = path.join(getSherpaDir(), 'specs');
      const backlogDir = path.join(getSherpaDir(), 'backlog');
      
      if (!await fileExists(getSherpaDir())) {
        console.log(chalk.red('❌ Sherpa OS not initialized. Run `sherpa init` first.'));
        return;
      }
      
      if (!await fileExists(specsDir)) {
        console.log(chalk.yellow('⚠️  No specs directory found. Create specs first with `sherpa add:spec`.'));
        return;
      }
      
      await ensureDir(path.join(backlogDir, 'epics'));
      await ensureDir(path.join(backlogDir, 'stories'));
      await ensureDir(path.join(backlogDir, 'tickets'));
      
      let specsToProcess: string[];
      
      if (options.spec) {
        const specFile = options.spec.endsWith('.md') ? options.spec : `${options.spec}.md`;
        const specPath = path.join(specsDir, specFile);
        if (!await fileExists(specPath)) {
          console.log(chalk.red(`❌ Spec file not found: ${specFile}`));
          return;
        }
        specsToProcess = [specFile];
      } else {
        // Get all spec files
        const files = await fs.readdir(specsDir);
        specsToProcess = files.filter(f => f.endsWith('.md'));
        
        if (specsToProcess.length === 0) {
          console.log(chalk.yellow('⚠️  No specification files found. Create specs first with `sherpa add:spec`.'));
          return;
        }
      }
      
      const spinner = ora('Analyzing specifications...').start();
      
      const backlogItems = {
        epics: [] as Epic[],
        stories: [] as Story[],
        tickets: [] as Ticket[]
      };
      
      for (const specFile of specsToProcess) {
        const specPath = path.join(specsDir, specFile);
        const specContent = await readMarkdown(specPath);
        const parsedSpec = parseSpecification(specContent, specFile);
        
        spinner.text = `Processing ${parsedSpec.title}...`;
        
        // Generate epic
        const epic = generateEpicFromSpec(parsedSpec);
        backlogItems.epics.push(epic);
        
        // Generate stories
        const stories = generateStoriesFromSpec(parsedSpec, epic.epic_id);
        backlogItems.stories.push(...stories);
        
        // Generate tickets from stories
        for (const story of stories) {
          const tickets = generateTicketsFromStory(parsedSpec, story);
          backlogItems.tickets.push(...tickets);
        }
      }
      
      spinner.text = 'Generating backlog files...';
      
      if (options.dryRun) {
        spinner.succeed('Dry run completed!');
        console.log(chalk.blue('\n📊 Backlog Generation Preview:'));
        console.log(`📁 Epics: ${backlogItems.epics.length}`);
        console.log(`📚 Stories: ${backlogItems.stories.length}`);
        console.log(`🎫 Tickets: ${backlogItems.tickets.length}`);
        
        backlogItems.epics.forEach(epic => {
          console.log(chalk.green(`\n📁 ${epic.title}`));
          const epicStories = backlogItems.stories.filter(s => s.epic_id === epic.epic_id);
          epicStories.forEach(story => {
            console.log(`  📚 ${story.title}`);
            const storyTickets = backlogItems.tickets.filter(t => t.ticket_id && story.tickets.includes(t.ticket_id));
            storyTickets.forEach(ticket => {
              console.log(`    🎫 ${ticket.title} (${ticket.timebox_hours}h)`);
            });
          });
        });
        return;
      }
      
      // Save backlog items
      for (const epic of backlogItems.epics) {
        const epicPath = path.join(backlogDir, 'epics', `${epic.epic_id}.yml`);
        if (!await fileExists(epicPath) || options.force) {
          await writeYaml(epicPath, epic);
        }
      }
      
      for (const story of backlogItems.stories) {
        const storyPath = path.join(backlogDir, 'stories', `${story.story_id}.yml`);
        if (!await fileExists(storyPath) || options.force) {
          await writeYaml(storyPath, story);
        }
      }
      
      for (const ticket of backlogItems.tickets) {
        const ticketPath = path.join(backlogDir, 'tickets', `${ticket.ticket_id}.yml`);
        if (!await fileExists(ticketPath) || options.force) {
          await writeYaml(ticketPath, ticket);
        }
      }
      
      spinner.succeed('Backlog generated successfully!');
      
      console.log(chalk.green('\n✅ Backlog Generation Complete'));
      console.log(chalk.blue(`📁 Epics: ${backlogItems.epics.length}`));
      console.log(chalk.blue(`📚 Stories: ${backlogItems.stories.length}`));
      console.log(chalk.blue(`🎫 Tickets: ${backlogItems.tickets.length}`));
      
      console.log(chalk.gray('\n💡 Next steps:'));
      console.log(chalk.gray('   1. Review generated tickets in .sherpa/backlog/'));
      console.log(chalk.gray('   2. Edit tickets to refine requirements'));
      console.log(chalk.gray('   3. Run `sherpa gen:prompt` to create AI prompts'));
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

interface ParsedSpec {
  title: string;
  priority: string;
  effort: number;
  type: string;
  overview: string;
  requirements: string[];
  userStories: string[];
  acceptanceCriteria: string[];
  apiChanges: string[];
  dbChanges: string[];
  uiChanges: string[];
  testingStrategy: string[];
}

function parseSpecification(content: string, filename: string): ParsedSpec {
  const lines = content.split('\n');
  
  // Extract metadata from frontmatter
  let title = filename.replace('.md', '').replace(/-/g, ' ');
  let priority = 'medium';
  let effort = 8;
  let type = 'feature';
  
  // Parse title from first heading
  const titleMatch = content.match(/^#\s+(.+)/m);
  if (titleMatch) {
    title = titleMatch[1] || title;
  }
  
  // Parse metadata
  const priorityMatch = content.match(/\*\*Priority\*\*:\s*(.+)/);
  if (priorityMatch && priorityMatch[1]) {
    priority = priorityMatch[1].toLowerCase();
  }
  
  const effortMatch = content.match(/\*\*Effort\*\*:\s*(\d+)/);
  if (effortMatch && effortMatch[1]) {
    effort = parseInt(effortMatch[1]);
  }
  
  const typeMatch = content.match(/\*\*Type\*\*:\s*(.+)/);
  if (typeMatch && typeMatch[1]) {
    type = typeMatch[1].toLowerCase();
  }
  
  // Extract sections
  const overview = extractSection(content, 'Overview') || 'No overview provided';
  const requirements = extractListItems(content, 'Functional Requirements');
  const userStories = extractUserStories(content);
  const acceptanceCriteria = extractListItems(content, 'Acceptance Criteria');
  const apiChanges = extractCodeBlock(content, 'API Changes');
  const dbChanges = extractCodeBlock(content, 'Database Changes');
  const uiChanges = extractListItems(content, 'UI/UX Changes');
  const testingStrategy = extractListItems(content, 'Testing Strategy');
  
  return {
    title,
    priority,
    effort,
    type,
    overview,
    requirements,
    userStories,
    acceptanceCriteria,
    apiChanges,
    dbChanges,
    uiChanges,
    testingStrategy
  };
}

function extractSection(content: string, sectionName: string): string {
  const regex = new RegExp(`##\\s+${sectionName}\\s*\\n([\\s\\S]*?)(?=##|$)`, 'i');
  const match = content.match(regex);
  return match && match[1] ? match[1].trim() : '';
}

function extractListItems(content: string, sectionName: string): string[] {
  const sectionContent = extractSection(content, sectionName);
  const items: string[] = [];
  
  const lines = sectionContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
      items.push(trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, ''));
    } else if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
      items.push(trimmed.replace(/^-\s*\[[x\s]\]\s*/, ''));
    }
  }
  
  return items.filter(item => item.length > 0);
}

function extractUserStories(content: string): string[] {
  const userStoryRegex = /\*\*As a\*\*\s+(.+?)\s+\*\*I want\*\*\s+(.+?)\s+\*\*so that\*\*\s+(.+)/gi;
  const stories: string[] = [];
  let match;
  
  while ((match = userStoryRegex.exec(content)) !== null) {
    stories.push(`As a ${match[1]} I want ${match[2]} so that ${match[3]}`);
  }
  
  return stories;
}

function extractCodeBlock(content: string, sectionName: string): string[] {
  const sectionContent = extractSection(content, sectionName);
  const codeBlockRegex = /```[\s\S]*?```/g;
  const matches = sectionContent.match(codeBlockRegex);
  
  if (matches) {
    return matches.map(block => block.replace(/```\w*\n?/, '').replace(/```$/, '').trim());
  }
  
  return [];
}

function generateEpicFromSpec(spec: ParsedSpec): Epic {
  return {
    epic_id: generateEpicId(),
    title: spec.title,
    description: spec.overview,
    tickets: [] // Will be populated later
  };
}

function generateStoriesFromSpec(spec: ParsedSpec, epicId: string): Story[] {
  const stories: Story[] = [];
  
  // Generate stories from user stories if available
  if (spec.userStories.length > 0) {
    spec.userStories.forEach((userStory, index) => {
      stories.push({
        story_id: generateStoryId(),
        title: `User Story ${index + 1}`,
        description: userStory,
        epic_id: epicId,
        tickets: []
      });
    });
  } else {
    // Generate default stories based on spec type
    const defaultStories = getDefaultStoriesForType(spec.type);
    defaultStories.forEach(storyTemplate => {
      stories.push({
        story_id: generateStoryId(),
        title: storyTemplate.title,
        description: storyTemplate.description.replace('{title}', spec.title),
        epic_id: epicId,
        tickets: []
      });
    });
  }
  
  return stories;
}

function getDefaultStoriesForType(type: string): { title: string, description: string }[] {
  switch (type) {
    case 'api':
      return [
        { title: 'API Design & Documentation', description: 'Design and document the API endpoints for {title}' },
        { title: 'API Implementation', description: 'Implement the backend API for {title}' },
        { title: 'API Testing & Validation', description: 'Test and validate the API implementation for {title}' }
      ];
    case 'improvement':
      return [
        { title: 'Analysis & Planning', description: 'Analyze current state and plan improvements for {title}' },
        { title: 'Implementation', description: 'Implement the improvements for {title}' },
        { title: 'Migration & Testing', description: 'Handle migration and test the improvements for {title}' }
      ];
    default:
      return [
        { title: 'Core Implementation', description: 'Implement the core functionality for {title}' },
        { title: 'UI/UX Implementation', description: 'Implement the user interface for {title}' },
        { title: 'Testing & Polish', description: 'Test, polish and finalize {title}' }
      ];
  }
}

function generateTicketsFromStory(spec: ParsedSpec, story: Story): Ticket[] {
  const tickets: Ticket[] = [];
  const ticketsPerStory = Math.ceil(spec.effort / 3); // Distribute effort across stories
  const hoursPerTicket = Math.min(8, Math.ceil(spec.effort / ticketsPerStory));
  
  for (let i = 0; i < ticketsPerStory; i++) {
    const ticketId = generateTicketId();
    const ticket: Ticket = {
      ticket_id: ticketId,
      title: `${story.title} - Part ${i + 1}`,
      outcome: `Complete implementation of ${story.title.toLowerCase()}`,
      scope_in: [`Implementation of ${story.title}`],
      scope_out: ['Performance optimization', 'Advanced error handling'],
      acceptance_criteria: spec.acceptanceCriteria.length > 0 
        ? spec.acceptanceCriteria.slice(i, i + 2)
        : [`Given the requirements, when implementing ${story.title}, then the functionality should work as specified`],
      apidiff: spec.apiChanges,
      dbdiff: spec.dbChanges,
      ui_components: spec.uiChanges,
      telemetry: {
        events: [`${story.title.toLowerCase().replace(/\s+/g, '_')}_completed`],
        alerts: [`${story.title.toLowerCase().replace(/\s+/g, '_')}_failed`]
      },
      test_plan: {
        unit: spec.testingStrategy.filter(t => t.toLowerCase().includes('unit')),
        e2e: spec.testingStrategy.filter(t => t.toLowerCase().includes('e2e') || t.toLowerCase().includes('integration'))
      },
      timebox_hours: hoursPerTicket,
      owner: 'unassigned'
    };
    
    tickets.push(ticket);
    story.tickets.push(ticketId);
  }
  
  return tickets;
}