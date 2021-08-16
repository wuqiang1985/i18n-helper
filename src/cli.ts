#!/usr/bin/env node
import path from 'path';

import { program } from 'commander';

import Logger from './util/logger';
import { generateConfiguration, parseI18nConf } from './util/fileHelper';
import doScan from './command/scan';
import { iCmd, iTranType, TransType } from './types';
import pkg from '../package.json';

function scan(
  filePath: string | undefined,
  language: string | undefined,
  cmdConf: Partial<iCmd>,
) {
  const i18nConf = parseI18nConf(filePath, language);
  if (i18nConf) {
    if (cmdConf.wrap || cmdConf.extract) {
      // 包裹 & 提取词条必须要要有路径
      if (i18nConf.parsedPath) {
        // const absolutePath = path.resolve(i18nConf.parsedPath);
        i18nConf.parsedPath = path.resolve(i18nConf.parsedPath);

        doScan(i18nConf, cmdConf);
      } else {
        Logger.error(
          '【路径错误】请检查命令指定路径 或 i18n.config.json 中【srcPath】配置',
        );
        Logger.error(`当前获取路径为：${i18nConf.parsedPath}`);
      }
    } else if (i18nConf.parsedLanguages) {
      doScan(i18nConf, cmdConf);
    } else {
      Logger.error(
        '【语言错误】请检查命令指定语言 或 i18n.config.json 中【languages】配置',
      );
      Logger.error(`当前获取路径为：${i18nConf.parsedLanguages}`);
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
    .option('-l, --language [language]', '指定语言')
    .option('-w, --wrap', '包裹词条')
    .option('-e, --extract', '提取词条')
    .option('-t, --translateSource', '从源文件翻译')
    .option('-tm, --translateMachine', '机器翻译')
    .option('-c, --count', '统计翻译情况')
    .option('-f, --file [file]', '统计翻译情况')
    .action((filePath: undefined | string, options) => {
      const { language, ...cmdObj } = options;
      scan(filePath, language, cmdObj);
    });

  program
    .command('wrap [filePath]')
    .description('包裹词条')
    .action((filePath: string | undefined) => {
      scan(filePath, undefined, { wrap: true });
    });

  program
    .command('extract [filePath]')
    .description('提取词条')
    .option('-l, --language [language]', '指定语言')
    .action((filePath: string | undefined, options) => {
      const { language } = options;
      scan(filePath, language, { extract: true });
    });

  program
    .command('translate [language]')
    .option('-m, --machine', '机器翻译')
    .description('自动翻译')
    .action((language: string | undefined, tansType: iTranType) => {
      const cmdConf = tansType.machine
        ? { translateMachine: true }
        : { translateSource: true };

      scan(undefined, language, cmdConf);
    });

  program
    .command('count [language]')
    .description('统计翻译情况')
    .action((language: string | undefined) => {
      scan(undefined, language, { count: true });
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
 详情参见：https://github.com/wuqiang1985/i18n-helper`);
  });

  program.parse(process.argv);
}

init();
