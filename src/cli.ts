#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
import path from 'path';

import { program } from 'commander';

import Logger from './util/logger';
import { generateConfiguration } from './util/fileHelper';
import run from './wrapper';

import pkg from '../package.json';

const i18nDefaultConfiguration = require('./config/i18n.default.config');

function init() {
  program.version(pkg.version, '-v, --version');

  program
    .command('config')
    .description('初始化配置文件')
    .option('-y, --yes', '默认配置')
    .action((cmdObj) => {
      const useDefaultConfig = cmdObj.yes;
      generateConfiguration(useDefaultConfig);
    });

  program
    .command('add-locale <locales...>')
    .description('添加多语言')
    .action((locales) => {
      console.log(locales);
      // Todo 生成多语言文件
    });

  program
    .command('wrap [path]')
    .option(
      '-p, --srcPath [srcPath]',
      '文件或文件夹路径',
      i18nDefaultConfiguration.srcPath,
    )
    .option(
      '-w, --wrapperFuncName [name]',
      '包裹方法名',
      i18nDefaultConfiguration.wrapperFuncName,
    )
    .description('包裹词条')
    .action((filePath, cmdObj) => {
      // console.log(cmdObj.srcPath);
      // console.log(cmdObj.wrapperFuncName);
      // console.log(`filepath: ${filePath}`);

      const specifiedPath = filePath || i18nDefaultConfiguration.srcPath;
      // console.log(`specifiedPath: ${specifiedPath}`);
      if (specifiedPath) {
        const absolutePath = path.resolve(specifiedPath);

        run(absolutePath);
      } else {
        Logger.error(
          `【路径缺失】-- 请指定路径
  1. xxx wrap [path]
  2. 检查i18n.config.js srcPath 配置`,
        );
      }
    });

  program
    .command('extract <filePath>')
    .description('提取词条')
    .action((filePath) => {
      console.log(filePath);
    });

  program.on('--help', () => {
    Logger.info(`
  使用指南：
    i18n-helper config -y                   # 初始化默认i18n配置文件
    i18n-helper config                      # 自定义初始化i18n配置文件
    i18n-helper add-locale <locales...>     # 添加多语言文件
    i18n-helper wrap [path]                 # 包裹词条
    i18n-helper extract [path]              # 提取词条

    详情参见：https://github.com/wuqiang1985/i18n-helper
    `);
  });

  program.parse(process.argv);
}

init();
