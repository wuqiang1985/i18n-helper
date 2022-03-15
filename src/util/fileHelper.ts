/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import path from 'path';

import fse from 'fs-extra';
import inquirer from 'inquirer';
import glob from 'glob';
import minimatch from 'minimatch';
import shell from 'shelljs';
import _ from 'lodash';
import prettier from 'prettier';

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
 * 根据 exclude 中的路径或文件过滤
 * @param parsedExclude
 * @param changedFiles
 * @returns 排除后的文件列表
 */
const FilterFilesByExclude = (
  parsedExclude: string[] | undefined,
  changedFiles: string[],
): string[] => {
  const fileArr: string[] = [];
  const dirArr: string[] = [];
  let excludeTmpFiles: string[] = [];
  let excludeTmpDirs: string[] = [];

  parsedExclude?.map((item) => {
    if (item.includes('.')) {
      fileArr.push(item);
    } else {
      dirArr.push(item);
    }
  });

  if (fileArr.length > 0) {
    const filePattern =
      fileArr.length === 1
        ? `**/${fileArr.join(',')}`
        : `**/{${fileArr.join(',')}}`;

    excludeTmpFiles = minimatch.match(changedFiles, filePattern);
  }

  if (dirArr.length > 0) {
    const dirPattern =
      dirArr.length === 1
        ? `**/${dirArr.join(',')}/**`
        : `**/{${dirArr.join(',')}}/**`;

    excludeTmpDirs = minimatch.match(changedFiles, dirPattern);
  }

  const excludeFiles = Array.from(
    new Set([...excludeTmpFiles, ...excludeTmpDirs]),
  );

  changedFiles = _.difference(changedFiles, excludeFiles);

  return changedFiles;
};

/**
 * 获取符合规则文件列表 - 指定路径srcPath下，符合fileExt后缀文件，过滤exclude路径或文件
 * @param i18nConf i18n配置
 * @returns 符合条件文件列表
 */
const getMatchedFilesByPath = (i18nConf: iI18nConf): string[] => {
  let files: string[] = [];
  const filePath = i18nConf.parsedPath as string;
  const { fileExt } = i18nConf;
  const stat = fs.statSync(filePath);

  if (stat.isFile() && fileExt.includes(path.extname(filePath).substr(1))) {
    files.push(filePath);
  } else if (stat.isDirectory()) {
    const ext = fileExt.includes(',') ? `{${fileExt}}` : fileExt;
    const pattern = `${filePath}/**/*.${ext}`;

    // TODO: Exclude 为空时还需要处理
    const ignorePath = i18nConf.parsedExclude?.map((item) => {
      return item.includes('.')
        ? `${filePath}/**/${item}`
        : `${filePath}/**/${item}/**`;
    });

    const option = {
      ignore: ignorePath,
    };

    files = glob.sync(pattern, option);
  }

  return files;
};

/**
 * 获取符合规则文件列表 - git中修改或者新增的文件，同时符合i18n配置fileExt后缀文件，过滤exclude路径或文件
 * @param i18nConf i18n配置
 * @returns 符合条件文件列表
 */
const getMatchedFilesByGit = (i18nConf: iI18nConf): string[] => {
  const { fileExt, parsedExclude, srcPath } = i18nConf;

  // TODO: 晚点看看
  // 新增一个文件夹，再往里面加文件(e.g. src下新建文件夹test，文件夹中新建文件a.js)，此时无法把a.js扫出，反而会扫出test/，
  // 如果是一个已在git仓库中的文件夹里加一个文件则会被扫描出来，同git status
  const gitCommand = `git status --porcelain | awk '!match($1, "D"){print $2}'`;

  // git 非 delete 文件列表
  let changedFiles = shell
    .exec(gitCommand, {
      silent: true,
    })
    .stdout.split('\n');
  // 最后一个为空，所以弹出
  changedFiles.pop();

  const fileExtPatten = `**/*.{${fileExt}}`;

  // 按文件后缀过滤
  changedFiles = minimatch.match(changedFiles, fileExtPatten);

  // 按exclude过滤
  changedFiles = FilterFilesByExclude(parsedExclude, changedFiles);

  return changedFiles;
};

/**
 * 获取指定路径下匹配的文件
 * @param i18nConf i18n配置
 * @returns 指定路径下符匹配的文件列表
 */
const getMatchedFiles = (i18nConf: iI18nConf): string[] => {
  let files: string[] = [];

  const { gitModel } = i18nConf;
  if (gitModel) {
    const isGitInstalled = !!shell.which('git');
    if (isGitInstalled) {
      files = getMatchedFilesByGit(i18nConf);
    } else {
      Logger.error('未安装git，只能试用文件路径形式，请将gitMode设为false');
    }
  } else {
    files = getMatchedFilesByPath(i18nConf);
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

const getPrettierConfig = () => {
  let prettierConfig = null;
  const pattern = `*prettier*`;
  const option = {
    ignore: '*prettierignore',
    dot: true,
  };

  const files = glob.sync(pattern, option);
  if (files.length > 0) {
    prettierConfig = prettier.resolveConfig.sync(files[0]);
  }

  return prettierConfig;
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
      /(\n|;)/g,
      '',
    );

    i18nConf.parsedExcludeWrapperFuncNameRegex = new RegExp(
      i18nConf.excludeWrapperFuncName.split(',').join('|'),
    );

    if (i18nConf.format.toLowerCase() !== 'eslint') {
      i18nConf.parsedPrettierConfig = getPrettierConfig();
    }

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
  FilterFilesByExclude,
};
