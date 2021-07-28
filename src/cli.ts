#!/usr/bin/env node
import path from 'path';
import fs from 'fs';

import { program } from 'commander';

import { I18N_CONFIGURATION_FILE_NAME } from './config/const';
import Logger from './util/logger';
import { generateConfiguration } from './util/fileHelper';
import run from './wrapper';

import pkg from '../package.json';

function init() {
  program.version(pkg.version, '-v, --version');

  program
    .command('init')
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
    // .option(
    //   '-p, --srcPath [srcPath]',
    //   '文件或文件夹路径',
    //   i18nDefaultConfiguration.srcPath,
    // )
    // .option(
    //   '-w, --wrapperFuncName [name]',
    //   '包裹方法名',
    //   i18nDefaultConfiguration.wrapperFuncName,
    // )
    .description('包裹词条')
    .action(async (filePath, cmdObj) => {
      // console.log(cmdObj.srcPath);
      // console.log(cmdObj.wrapperFuncName);
      // console.log(`filepath: ${filePath}`);
      const configFileName = path.resolve(I18N_CONFIGURATION_FILE_NAME);
      const isConfigFileExist = fs.existsSync(configFileName);
      if (isConfigFileExist) {
        const configFile = await import(configFileName);
        const specifiedPath = filePath || configFile.srcPath;
        if (specifiedPath) {
          const absolutePath = path.resolve(specifiedPath);
          run(absolutePath, configFile);
        } else {
          Logger.error(
            '【路径错误】请检查命令行【wrap】后的路径 或 i18n.config.json 【srcPath】配置',
          );
          Logger.error(`当前获取路径为：${specifiedPath}`);
        }
      } else {
        Logger.error('【配置错误】请先运行 i18n-helper init 生成配置文件');
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
