#!/usr/bin/env node
import path from 'path';

import { program } from 'commander';

import Logger from './util/logger';
import { generateConfiguration, parseI18nConf } from './util/fileHelper';
import doScan from './command/scan';
import { countTranslation } from './command/count';
import translate from './command/translate';
import pkg from '../package.json';
import { iCmd, iTranType, TransType } from './types';

function scan(filePath: string | undefined, cmdConf: iCmd) {
  const i18nConf = parseI18nConf();
  if (i18nConf) {
    const specifiedPath = filePath || i18nConf.srcPath;
    if (specifiedPath) {
      const absolutePath = path.resolve(specifiedPath);

      doScan(absolutePath, i18nConf, cmdConf);
    } else {
      Logger.error(
        '【路径错误】请检查命令行【we】后的路径 或 i18n.config.json 中【srcPath】配置',
      );
      Logger.error(`当前获取路径为：${specifiedPath}`);
    }
  }
}

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
    .command('scan [filePath]')
    .description('包裹 & 提取 & 自动翻译 & 统计翻译情况')
    .option('-w, --wrap', '包裹词条')
    .option('-e, --extract', '提取词条')
    .option('-t, --translateSource', '从源文件翻译')
    .option('-tm, --translateMachine', '机器翻译')
    .option('-c, --count', '统计翻译情况')
    .action(async (filePath: undefined | string, cmdObj: iCmd) => {
      scan(filePath, cmdObj);
    });

  program
    .command('wrap [filePath]')
    .description('包裹词条')
    .action((filePath: string | undefined) => {
      const cmdConf: iCmd = {
        wrap: true,
        extract: false,
        translateMachine: false,
        translateSource: false,
        count: false,
      };

      scan(filePath, cmdConf);
    });

  program
    .command('extract [filePath]')
    .description('提取词条')
    .action((filePath: string | undefined) => {
      const cmdConf: iCmd = {
        wrap: false,
        extract: true,
        translateMachine: false,
        translateSource: false,
        count: false,
      };

      scan(filePath, cmdConf);
    });

  program
    .command('translate [language]')
    .option('-m, --machine', '机器翻译')
    .description('自动翻译')
    .action((language: string | undefined, tansType: iTranType) => {
      const i18nConf = parseI18nConf();

      if (i18nConf) {
        const languages = language || i18nConf.languages;
        if (tansType.machine) {
          translate(languages, i18nConf, TransType.TMT);
        } else {
          translate(languages, i18nConf, TransType.SourceFile);
        }
      }
    });

  program
    .command('count [language]')
    .description('统计翻译情况')
    .action((language: string | undefined) => {
      const i18nConf = parseI18nConf();
      if (i18nConf) {
        const languages = language || i18nConf.languages;

        countTranslation(languages, i18nConf);
      }
    });

  program
    .command('capture [language]')
    .description('网页截屏')
    .action((language: string | undefined) => {
      console.log('coming soon');
    });

  program
    .command('checkTrans [language]')
    .description('翻译检查')
    .action((language: string | undefined) => {
      console.log('coming soon');
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
