#!/usr/bin/env node
import path from 'path';

import { program } from 'commander';

import Logger from './util/logger';
import { generateConfiguration, parseI18nConf } from './util/fileHelper';
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
    .command('we [filePath]')
    .description('we:(wrap & extract) 包裹 & 提取词条')
    .action(async (filePath) => {
      const i18nConf = parseI18nConf();
      if (i18nConf) {
        const specifiedPath = filePath || i18nConf.srcPath;
        if (specifiedPath) {
          const absolutePath = path.resolve(specifiedPath);
          run(absolutePath, i18nConf);
        } else {
          Logger.error(
            '【路径错误】请检查命令行【we】后的路径 或 i18n.config.json 中【srcPath】配置',
          );
          Logger.error(`当前获取路径为：${specifiedPath}`);
        }
      }
    });

  program
    .command('wrap [filePath]')
    .description('包裹词条')
    .action((filePath) => {
      Logger.info('coming soon...');
    });

  program
    .command('extract [filePath]')
    .description('提取词条')
    .action((filePath) => {
      Logger.info('coming soon...');
    });

  program
    .command('translate [language]')
    .description('自动翻译')
    .action((language) => {
      Logger.info('coming soon...');
    });

  program
    .command('count [language]')
    .description('统计翻译情况')
    .action((language) => {
      const i18nConf = parseI18nConf();
      if (i18nConf) {
        console.log('i18n');
      }
    });

  program.on('--help', () => {
    Logger.info(`
  使用指南：
    i18n-helper init -y                     # 生成i18n配置文件（i18n.config.json），默认React模式
    i18n-helper init                        # 自定义生成i18n配置文件(（i18n.config.json）)
    i18n-helper we [filePath]               # 提取 & 包裹词条，不传filePath，则以i18n配置文件中srcPath为准
    i18n-helper wrap [filePath]             # 包裹词条，不传filePath，则取i18n配置文件中srcPath
    i18n-helper extract [filePath]          # 提取词条，不传filePath，则取i18n配置文件中srcPath
    i18n-helper translate [language]        # 自动翻译，不传language，则取i18n配置文件中languages
    i18n-helper count [language]            # 统计翻译，不传language，则取i18n配置文件中languages

    详情参见：https://github.com/wuqiang1985/i18n-helper
    `);
  });

  program.parse(process.argv);
}

init();
