/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import path from 'path';

import fse from 'fs-extra';
import inquirer from 'inquirer';
import glob from 'glob';

import Logger from './logger';
import { I18N_CONFIGURATION_FILE_NAME } from '../config/const';
import questions from '../config/questionList';
import { formatJSON } from './helper';
import { iI18nConf } from '../types';

const i18nDefaultConfiguration = require('../config/i18n.default.config');

/**
 * 生成i18n配置文件
 * @param configuration i18n配置
 */
const doGenerateConfiguration = (configuration: any) => {
  const configurationStr = formatJSON(configuration);
  fs.writeFileSync(I18N_CONFIGURATION_FILE_NAME, configurationStr, 'utf8');
  Logger.success('i18n.config.json 生成成功');
};

/**
 * 生成配置文件
 * @param useDefaultConfig 是否用默认配置生成
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
 * 获取指定路径下文件路径
 * @param filePath 文件|文件夹路径
 * @param stat fs.Stats
 * @param i18nConf i18n配置
 * @returns
 */
const getMatchedFiles = (
  filePath: string,
  stat: fs.Stats,
  i18nConf: iI18nConf,
): string[] => {
  let files: string[] = [];

  if (stat.isFile()) {
    files.push(filePath);
  } else if (stat.isDirectory()) {
    const pattern = `${filePath}/**/*.{${i18nConf.fileExt}}`;
    const ignorePath = i18nConf.parsedExclude?.map((item) => {
      return `**/${item}/**`;
    });
    const option = {
      // ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      ignore: ignorePath,
    };

    files = glob.sync(pattern, option);
  }

  return files;
};

/**
 * i18n配置文件是否存在
 * @returns i18n配置文件是否存在
 */
const isI18nConfExited = () => {
  const configFileName = path.resolve(I18N_CONFIGURATION_FILE_NAME);
  return fs.existsSync(configFileName);
};

/**
 * 读取 i18n 配置文件
 * @returns i18n 配置对象
 */
const parseI18nConf = (): iI18nConf | null => {
  const configFileName = path.resolve(I18N_CONFIGURATION_FILE_NAME);

  if (isI18nConfExited()) {
    const i18nConf: iI18nConf = fse.readJSONSync(configFileName);
    const importArray = i18nConf.importStr.split(' ');

    i18nConf.parsedExclude = i18nConf.exclude.split(',');
    i18nConf.parsedLanguages = i18nConf.languages.split(',');
    i18nConf.parsedImportKey = importArray[importArray.length - 1];

    return i18nConf;
  }

  Logger.error('【配置错误】请先运行 i18n-helper init 生成配置文件');
  return null;
};

export {
  generateConfiguration,
  getMatchedFiles,
  isI18nConfExited,
  parseI18nConf,
};
