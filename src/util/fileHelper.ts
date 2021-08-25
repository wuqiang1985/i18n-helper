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
  // Logger.success(t('i18n.config.json 生成成功'));
  Logger.success('i18n.config.json is generated successfully');
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
    const { fileExt } = i18nConf;
    const ext = fileExt.includes(',') ? `{${fileExt}}` : fileExt;
    const pattern = `${filePath}/**/*.${ext}`;
    const ignorePath = i18nConf.parsedExclude?.map((item) => {
      return `./**/${item}/**`;
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
const isI18nConfExited = (): boolean => {
  const configFileName = path.resolve(I18N_CONFIGURATION_FILE_NAME);
  return fs.existsSync(configFileName);
};
/**
 * 读取 i18n 配置文件
 * @returns i18n 配置对象
 */
const parseI18nConf = (
  filePath?: string | undefined,
  language?: string | undefined,
  needPrint = true,
): iI18nConf | null => {
  const configFileName = path.resolve(I18N_CONFIGURATION_FILE_NAME);

  if (isI18nConfExited()) {
    const i18nConf: iI18nConf = fse.readJSONSync(configFileName);
    const importArray = i18nConf.importStr.split(' ');
    const specifiedPath = filePath || i18nConf.srcPath;
    const specifiedLanguage = language || i18nConf.languages;
    i18nConf.parsedExclude = i18nConf.exclude.split(',');
    i18nConf.parsedLanguages = specifiedLanguage.split(',');
    i18nConf.parsedPath = specifiedPath;
    i18nConf.parsedImportKey = importArray[importArray.length - 1].replace(
      '\n',
      '',
    );
    i18nConf.parsedExcludeWrapperFuncName =
      i18nConf.excludeWrapperFuncName.split(',');

    return i18nConf;
  }

  if (needPrint) {
    // Logger.error(t('【配置错误】请先运行 i18n-helper init 生成配置文件'));
    Logger.error(
      'Missing configuration file, please Run "i18n-helper init" to generate it',
    );
  }

  return null;
};

export {
  generateConfiguration,
  getMatchedFiles,
  isI18nConfExited,
  parseI18nConf,
};
