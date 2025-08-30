import { Command } from 'commander';
import chalk from 'chalk';

export const reviewSpecCommand = new Command('review:spec')
  .description('Review and clarify specifications')
  .action(async () => {
    console.log(chalk.yellow('🚧 Command coming soon - review:spec'));
  });