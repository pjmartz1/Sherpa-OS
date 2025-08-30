import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { SessionManager } from '../utils/session.js';

export const sessionLogCommand = new Command('session:log')
  .description('Log session activities, decisions, and blockers')
  .option('-t, --type <type>', 'Type of log entry (decision, blocker, progress, ai)', 'progress')
  .option('-m, --message <message>', 'Log message')
  .action(async (options) => {
    try {
      const sessionManager = new SessionManager();
      const currentSession = await sessionManager.getCurrentSession();
      
      if (!currentSession) {
        console.log(chalk.yellow('⚠️  No active session found. Start a session first with a command like `sherpa gen:prompt`.'));
        return;
      }
      
      if (options.message && options.type === 'progress') {
        // Quick progress log
        await sessionManager.logProgress(
          'Manual Update',
          options.message,
          [],
          'none'
        );
        console.log(chalk.green('✅ Progress logged successfully!'));
        return;
      }
      
      // Interactive logging
      await interactiveSessionLog(sessionManager, options.type);
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

async function interactiveSessionLog(sessionManager: SessionManager, defaultType: string): Promise<void> {
  const { logType } = await inquirer.prompt([{
    type: 'list',
    name: 'logType',
    message: 'What would you like to log?',
    default: defaultType,
    choices: [
      { name: '📈 Progress milestone', value: 'progress' },
      { name: '🧠 Decision made', value: 'decision' },
      { name: '🚫 Blocker encountered', value: 'blocker' },
      { name: '🤖 AI interaction outcome', value: 'ai' },
      { name: '✅ Resolve existing blocker', value: 'resolve' }
    ]
  }]);
  
  switch (logType) {
    case 'progress':
      await logProgress(sessionManager);
      break;
    case 'decision':
      await logDecision(sessionManager);
      break;
    case 'blocker':
      await logBlocker(sessionManager);
      break;
    case 'ai':
      await logAIInteraction(sessionManager);
      break;
    case 'resolve':
      await resolveBlocker(sessionManager);
      break;
  }
}

async function logProgress(sessionManager: SessionManager): Promise<void> {
  const { milestone, description, files, testStatus } = await inquirer.prompt([
    {
      type: 'input',
      name: 'milestone',
      message: 'Progress milestone:',
      validate: input => input.length > 0
    },
    {
      type: 'input',
      name: 'description',
      message: 'Description:',
      validate: input => input.length > 0
    },
    {
      type: 'input',
      name: 'files',
      message: 'Files changed (comma-separated):',
      filter: input => input.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0)
    },
    {
      type: 'list',
      name: 'testStatus',
      message: 'Test status:',
      choices: [
        { name: '✅ Tests complete and passing', value: 'complete' },
        { name: '⚠️ Partial test coverage', value: 'partial' },
        { name: '❌ Tests failing', value: 'failing' },
        { name: '⭕ No tests yet', value: 'none' }
      ]
    }
  ]);
  
  await sessionManager.logProgress(milestone, description, files, testStatus);
  console.log(chalk.green('✅ Progress logged successfully!'));
}

async function logDecision(sessionManager: SessionManager): Promise<void> {
  const { decision, rationale, impact, reversible } = await inquirer.prompt([
    {
      type: 'input',
      name: 'decision',
      message: 'Decision made:',
      validate: input => input.length > 0
    },
    {
      type: 'input',
      name: 'rationale',
      message: 'Rationale:',
      validate: input => input.length > 0
    },
    {
      type: 'input',
      name: 'impact',
      message: 'Impact/consequences (comma-separated):',
      filter: input => input.split(',').map((i: string) => i.trim()).filter((i: string) => i.length > 0)
    },
    {
      type: 'confirm',
      name: 'reversible',
      message: 'Is this decision easily reversible?',
      default: true
    }
  ]);
  
  await sessionManager.logDecision(decision, rationale, impact, reversible);
  console.log(chalk.green('🧠 Decision logged successfully!'));
}

async function logBlocker(sessionManager: SessionManager): Promise<void> {
  const { description, category, severity } = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Blocker description:',
      validate: input => input.length > 0
    },
    {
      type: 'list',
      name: 'category',
      message: 'Blocker category:',
      choices: [
        { name: '🔧 Technical issue', value: 'technical' },
        { name: '📋 Requirements unclear', value: 'requirements' },
        { name: '📦 Dependency issue', value: 'dependency' },
        { name: '🧠 Knowledge gap', value: 'knowledge' }
      ]
    },
    {
      type: 'list',
      name: 'severity',
      message: 'Severity:',
      choices: [
        { name: '🔴 Critical - blocks all progress', value: 'critical' },
        { name: '🟡 High - significant impact', value: 'high' },
        { name: '🟠 Medium - moderate impact', value: 'medium' },
        { name: '🟢 Low - minor impact', value: 'low' }
      ]
    }
  ]);
  
  await sessionManager.logBlocker(description, category, severity);
  console.log(chalk.red('🚫 Blocker logged successfully!'));
}

async function logAIInteraction(sessionManager: SessionManager): Promise<void> {
  const { outcome, feedback, prompt, response } = await inquirer.prompt([
    {
      type: 'list',
      name: 'outcome',
      message: 'AI interaction outcome:',
      choices: [
        { name: '✅ Success - worked as expected', value: 'success' },
        { name: '❌ Failure - did not work', value: 'failure' },
        { name: '⚠️ Partial - needed modifications', value: 'partial' }
      ]
    },
    {
      type: 'input',
      name: 'feedback',
      message: 'Feedback/notes:',
      when: (answers) => answers.outcome !== 'success'
    },
    {
      type: 'input',
      name: 'prompt',
      message: 'Prompt summary (optional):',
    },
    {
      type: 'input',
      name: 'response',
      message: 'Response summary (optional):',
    }
  ]);
  
  await sessionManager.logAIInteraction(
    prompt || 'Manual log entry',
    response || 'Manual log entry',
    outcome,
    feedback || '',
    'manual'
  );
  
  console.log(chalk.green('🤖 AI interaction logged successfully!'));
}

async function resolveBlocker(sessionManager: SessionManager): Promise<void> {
  const session = await sessionManager.getCurrentSession();
  if (!session) return;
  
  const openBlockers = session.blockers.filter(b => b.status === 'open');
  
  if (openBlockers.length === 0) {
    console.log(chalk.green('✅ No open blockers found!'));
    return;
  }
  
  const { blockerId, resolution } = await inquirer.prompt([
    {
      type: 'list',
      name: 'blockerId',
      message: 'Which blocker to resolve?',
      choices: openBlockers.map(b => ({
        name: `${b.description} (${b.severity})`,
        value: b.id
      }))
    },
    {
      type: 'input',
      name: 'resolution',
      message: 'Resolution description:',
      validate: input => input.length > 0
    }
  ]);
  
  await sessionManager.resolveBlocker(blockerId, resolution);
  console.log(chalk.green('✅ Blocker resolved successfully!'));
}