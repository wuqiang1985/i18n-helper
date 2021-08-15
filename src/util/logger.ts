// import logSymbols from 'log-symbols';
import chalk from 'chalk';
import fse from 'fs-extra';

import { I18N_ERROR_LOG_FILE_NAME } from '../config/const';

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

  static appendFile(msg: string): void {
    fse.appendFileSync(
      I18N_ERROR_LOG_FILE_NAME,
      `[${new Date().toLocaleString()}]${msg}\n`,
    );
  }
}

export default Logger;
