/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';

import inquirer from 'inquirer';
import glob from 'glob';

import Logger from './logger';
import { DEFAULT_I18N_FILE_NAME, FILE_TYPE } from '../config/const';
import questions from '../config/questionList';
import { formatJSON } from './helper';

const i18nDefaultConfiguration = require('../config/i18n.default.config');

const doGenerateConfiguration = (configuration: any) => {
  const configurationStr = formatJSON(configuration);
  fs.writeFileSync(DEFAULT_I18N_FILE_NAME, configurationStr, 'utf8');
  Logger.success('i18n.config.json 生成成功');
};

/**
 * 生成配置文件
 */
const generateConfiguration = (useDefaultConfig: boolean): void => {
  if (useDefaultConfig) {
    doGenerateConfiguration(i18nDefaultConfiguration);
  } else {
    inquirer.prompt(questions).then((answers) => {
      doGenerateConfiguration(answers);
    });
  }
};

/**
 * 获取指定路径下文件
 */
const getMatchedFiles = (filePath: string, stat: fs.Stats): string[] => {
  let files = [];

  if (stat.isFile()) {
    files.push(filePath);
  }

  if (stat.isDirectory()) {
    const pattern = `${filePath}/**/*.{${FILE_TYPE}}`;
    const option = {
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    };
    files = glob.sync(pattern, option);
  }

  return files;
};

export { generateConfiguration, getMatchedFiles };
