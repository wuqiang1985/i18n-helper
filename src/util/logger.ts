// import logSymbols from 'log-symbols';
import chalk from 'chalk';

class Logger {
  static info(msg: string, needSymbols = false): void {
    if (needSymbols) {
      console.log(chalk.blue('ℹ'), chalk.cyan(msg));
    } else {
      console.log(chalk.cyan(msg));
    }
  }

  static error(msg: string): void {
    console.log(chalk.red('✖'), chalk.red(msg));
  }

  static warning(msg: string): void {
    // console.log(chalk.yellow('⚠'), chalk.yellow(msg));
    console.log(chalk.yellow('⚠'), chalk.yellow(msg));
  }

  static success(msg: string): void {
    console.log(chalk.green('✔'), chalk.green(msg));
  }
}

export default Logger;
