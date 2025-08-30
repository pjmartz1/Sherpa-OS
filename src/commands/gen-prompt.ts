import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { promises as fs } from 'fs';
import { getSherpaDir, ensureDir, writeMarkdown, readYaml, fileExists } from '../utils/fs.js';
import { PromptManager } from '../utils/prompts.js';
import { ContextManager } from '../utils/context.js';
import { SessionManager } from '../utils/session.js';
import { Ticket } from '../types/index.js';
import * as path from 'path';

export const genPromptCommand = new Command('gen:prompt')
  .description('Generate AI prompts from backlog')
  .option('-t, --ticket <ticket>', 'Specific ticket ID to generate prompt for')
  .option('-o, --output <file>', 'Output file for the prompt')
  .option('--context', 'Include full context injection')
  .option('--template <template>', 'Prompt template to use')
  .action(async (options) => {
    try {
      const backlogDir = path.join(getSherpaDir(), 'backlog');
      const promptsDir = path.join(getSherpaDir(), 'prompts');
      
      if (!await fileExists(getSherpaDir())) {
        console.log(chalk.red('❌ Sherpa OS not initialized. Run `sherpa init` first.'));
        return;
      }
      
      if (!await fileExists(backlogDir)) {
        console.log(chalk.yellow('⚠️  No backlog found. Run `sherpa gen:backlog` first.'));
        return;
      }
      
      await ensureDir(promptsDir);
      
      let ticketToProcess: Ticket;
      
      if (options.ticket) {
        // Load specific ticket
        const ticketPath = path.join(backlogDir, 'tickets', `${options.ticket}.yml`);
        if (!await fileExists(ticketPath)) {
          console.log(chalk.red(`❌ Ticket not found: ${options.ticket}`));
          return;
        }
        ticketToProcess = await readYaml<Ticket>(ticketPath);
      } else {
        // Let user select a ticket
        const selectedTicket = await selectTicket(backlogDir);
        if (!selectedTicket) {
          console.log(chalk.yellow('❌ No ticket selected.'));
          return;
        }
        ticketToProcess = selectedTicket;
      }
      
      const spinner = ora('Generating AI prompt...').start();
      
      // Initialize AI components
      const promptManager = new PromptManager();
      const contextManager = new ContextManager();
      const sessionManager = new SessionManager();
      
      // Initialize prompt templates if needed
      await promptManager.initializePrompts();
      
      spinner.text = 'Building context...';
      
      // Get or build context if requested
      let contextContent = '';
      if (options.context) {
        let context = await contextManager.getCompressedContext();
        if (!context) {
          spinner.text = 'Building codebase context...';
          context = await contextManager.buildContext(process.cwd());
        }
        
        const relevantContext = await contextManager.searchSimilarContext(
          `${ticketToProcess.title} ${ticketToProcess.outcome}`
        );
        
        contextContent = generateContextSection(context, relevantContext);
      }
      
      spinner.text = 'Generating prompt...';
      
      // Generate the prompt using the intelligent prompt system
      const generatedPrompt = await promptManager.generatePrompt(ticketToProcess);
      
      // Combine with context if requested
      let finalPrompt = generatedPrompt;
      if (contextContent) {
        finalPrompt = `${contextContent}\n\n---\n\n${generatedPrompt}`;
      }
      
      // Add files map
      const filesMap = await generateFilesMap(ticketToProcess);
      
      // Save the prompt
      const outputPath = options.output || 
        path.join(promptsDir, `${ticketToProcess.ticket_id}-prompt.md`);
      
      await writeMarkdown(outputPath, finalPrompt);
      
      // Save files map
      const filesMapPath = outputPath.replace('.md', '-files.json');
      await fs.writeFile(filesMapPath, JSON.stringify(filesMap, null, 2));
      
      // Start a session if none exists
      let session = await sessionManager.getCurrentSession();
      if (!session) {
        session = await sessionManager.initializeSession(ticketToProcess.ticket_id, ticketToProcess.title);
      }
      
      // Log the prompt generation
      await sessionManager.logProgress(
        'Prompt Generated',
        `Generated AI prompt for ticket ${ticketToProcess.ticket_id}`,
        [outputPath, filesMapPath],
        'none'
      );
      
      spinner.succeed('AI prompt generated successfully!');
      
      console.log(chalk.green(`\n✅ Prompt Generated: ${ticketToProcess.title}`));
      console.log(chalk.blue(`📄 Prompt: ${outputPath}`));
      console.log(chalk.blue(`📁 Files Map: ${filesMapPath}`));
      
      if (contextContent) {
        console.log(chalk.blue(`🧠 Context included from codebase analysis`));
      }
      
      console.log(chalk.gray('\n💡 Usage:'));
      console.log(chalk.gray('   1. Copy the prompt to your AI coding assistant'));
      console.log(chalk.gray('   2. Use the files map to include relevant files'));
      console.log(chalk.gray('   3. Implement the ticket requirements'));
      console.log(chalk.gray('   4. Use `sherpa session:log` to track progress'));
      console.log(chalk.gray('   5. Use `sherpa lint:ai` to check for AI anti-patterns'));
      
      // Show preview of the prompt
      console.log(chalk.blue('\n📝 Prompt Preview:'));
      console.log(chalk.gray('─'.repeat(60)));
      const previewLines = finalPrompt.split('\n').slice(0, 10);
      previewLines.forEach(line => {
        if (line.startsWith('#')) {
          console.log(chalk.yellow(line));
        } else if (line.startsWith('**')) {
          console.log(chalk.cyan(line));
        } else {
          console.log(line);
        }
      });
      if (finalPrompt.split('\n').length > 10) {
        console.log(chalk.gray('... (truncated)'));
      }
      console.log(chalk.gray('─'.repeat(60)));
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

async function selectTicket(backlogDir: string): Promise<Ticket | null> {
  const ticketsDir = path.join(backlogDir, 'tickets');
  
  if (!await fileExists(ticketsDir)) {
    console.log(chalk.yellow('⚠️  No tickets found. Generate backlog first.'));
    return null;
  }
  
  const ticketFiles = await fs.readdir(ticketsDir);
  const ymlFiles = ticketFiles.filter(f => f.endsWith('.yml'));
  
  if (ymlFiles.length === 0) {
    console.log(chalk.yellow('⚠️  No ticket files found.'));
    return null;
  }
  
  // Load ticket summaries
  const ticketChoices = [];
  for (const file of ymlFiles.slice(0, 20)) { // Limit to 20 for UI
    const ticketPath = path.join(ticketsDir, file);
    try {
      const ticket = await readYaml<Ticket>(ticketPath);
      ticketChoices.push({
        name: `${ticket.ticket_id}: ${ticket.title} (${ticket.timebox_hours}h)`,
        value: ticket
      });
    } catch (error) {
      // Skip invalid files
    }
  }
  
  if (ticketChoices.length === 0) {
    console.log(chalk.yellow('⚠️  No valid tickets found.'));
    return null;
  }
  
  const { selectedTicket } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedTicket',
    message: 'Select a ticket to generate prompt for:',
    choices: ticketChoices,
    pageSize: 15
  }]);
  
  return selectedTicket;
}

function generateContextSection(context: any, relevantContext: { patterns: any[], decisions: any[] }): string {
  return `# 🧠 Codebase Context

## Project Summary
${context.summary}

## Key Patterns to Follow
${relevantContext.patterns.slice(0, 3).map((pattern: any) => 
  `### ${pattern.name}
- **Usage**: ${pattern.frequency} times across ${pattern.files.length} files
- **Description**: ${pattern.description}
- **Example**: \`${pattern.example}\``
).join('\n\n')}

## Architectural Constraints
${relevantContext.decisions.map((decision: any) => 
  `### ${decision.title}
- **Decision**: ${decision.decision}
- **Rationale**: ${decision.rationale}`
).join('\n\n')}

## Important Reminders
- Follow the established patterns shown above
- Include comprehensive error handling (AI commonly misses this)
- Add TypeScript types for all new code
- Write tests that match the acceptance criteria
- Avoid over-abstraction - keep it concrete initially`;
}

async function generateFilesMap(ticket: Ticket): Promise<any> {
  const projectRoot = process.cwd();
  const relevantFiles: string[] = [];
  
  // Add commonly relevant files based on ticket content
  const commonFiles = [
    'package.json',
    'tsconfig.json',
    'README.md'
  ];
  
  for (const file of commonFiles) {
    const filePath = path.join(projectRoot, file);
    if (await fileExists(filePath)) {
      relevantFiles.push(file);
    }
  }
  
  // Add files based on ticket components
  if (ticket.ui_components && ticket.ui_components.length > 0) {
    // Look for component files
    try {
      const srcDir = path.join(projectRoot, 'src');
      if (await fileExists(srcDir)) {
        relevantFiles.push('src/components/**/*.{ts,tsx,js,jsx}');
      }
    } catch (error) {
      // Ignore if src doesn't exist
    }
  }
  
  if (ticket.apidiff && ticket.apidiff.length > 0) {
    // Look for API/backend files
    try {
      const apiPaths = [
        'src/api/**/*.{ts,js}',
        'src/routes/**/*.{ts,js}',
        'src/controllers/**/*.{ts,js}',
        'api/**/*.{ts,js}'
      ];
      relevantFiles.push(...apiPaths);
    } catch (error) {
      // Ignore
    }
  }
  
  if (ticket.test_plan && (ticket.test_plan.unit.length > 0 || ticket.test_plan.e2e.length > 0)) {
    relevantFiles.push('tests/**/*.{test,spec}.{ts,js}');
    relevantFiles.push('**/*.{test,spec}.{ts,js}');
  }
  
  return {
    ticket_id: ticket.ticket_id,
    title: ticket.title,
    relevant_files: relevantFiles,
    priority_files: relevantFiles.slice(0, 5), // Most important files first
    generated_at: new Date().toISOString(),
    instructions: {
      usage: "Include these files in your AI assistant's context for better code generation",
      priority: "Start with priority_files, then add others as needed",
      patterns: "Use glob patterns to include multiple files at once"
    }
  };
}