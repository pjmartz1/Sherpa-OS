#!/usr/bin/env node

import { Command } from 'commander';
import { setupCommand } from './commands/setup.js';
import { tutorialCommand } from './commands/tutorial.js';
import { initCommand } from './commands/init.js';
import { addStandardCommand } from './commands/add-standard.js';
import { addSpecCommand } from './commands/add-spec.js';
import { reviewSpecCommand } from './commands/review-spec.js';
import { genBacklogCommand } from './commands/gen-backlog.js';
import { genPromptCommand } from './commands/gen-prompt.js';
import { testCommand } from './commands/test.js';
import { briefCommand } from './commands/brief.js';
import { retroCommand } from './commands/retro.js';
import { velocityCommand } from './commands/velocity.js';
import { contextBuildCommand } from './commands/context-build.js';
import { contextInjectCommand } from './commands/context-inject.js';
import { promptOptimizeCommand } from './commands/prompt-optimize.js';
import { promptDebugCommand } from './commands/prompt-debug.js';
import { lintAiCommand } from './commands/lint-ai.js';
import { sessionLogCommand } from './commands/session-log.js';
import { handoffPrepCommand } from './commands/handoff-prep.js';
import { sessionResumeCommand } from './commands/session-resume.js';

const program = new Command();

program
  .name('sherpa')
  .description('Local-first CLI for solo AI coders')
  .version('0.1.0');

program.addCommand(setupCommand);
program.addCommand(tutorialCommand);
program.addCommand(initCommand);
program.addCommand(addStandardCommand);
program.addCommand(addSpecCommand);
program.addCommand(reviewSpecCommand);
program.addCommand(genBacklogCommand);
program.addCommand(genPromptCommand);
program.addCommand(testCommand);
program.addCommand(briefCommand);
program.addCommand(retroCommand);
program.addCommand(velocityCommand);
program.addCommand(contextBuildCommand);
program.addCommand(contextInjectCommand);
program.addCommand(promptOptimizeCommand);
program.addCommand(promptDebugCommand);
program.addCommand(lintAiCommand);
program.addCommand(sessionLogCommand);
program.addCommand(handoffPrepCommand);
program.addCommand(sessionResumeCommand);

program.parse();