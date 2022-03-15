#!/usr/bin/env node
import path from 'path';

import { program } from 'commander';
import fse from 'fs-extra';

import Logger from './util/logger';
import { generateConfiguration, parseI18nConf } from './util/fileHelper';
import doScan from './command/scan';
import { iCmd, iTranType } from './types';
import { t } from './i18n';
import { I18N_CONFIGURATION_FILE_NAME } from './config/const';
import { formatJSON } from './util/helper';
import pkg from '../package.json';

function scan(
  filePath: string | undefined,
  language: string | undefined,
  cmdConf: Partial<iCmd>,
) {
  const i18nConf = parseI18nConf(filePath, language);

  if (i18nConf) {
    if (cmdConf.wrap || cmdConf.extract || cmdConf.check) {
      // 包裹 & 提取词条必须要要有路径
      if (i18nConf.parsedPath) {
        // i18nConf.parsedPath = path.resolve(i18nConf.parsedPath);
        doScan(i18nConf, cmdConf);
      } else {
        Logger.error(
          t(
            '【路径错误】请检查命令指定路径 或 i18n.config.json 中【srcPath】配置',
          ),
        );
        Logger.error(
          t('当前获取路径为：{{parsedPath}}', {
            parsedPath: i18nConf.parsedPath,
          }),
        );
      }
    } else if (i18nConf.parsedLanguages) {
      doScan(i18nConf, cmdConf);
    } else {
      Logger.error(
        t(
          '【语言错误】请检查命令指定语言 或 i18n.config.json 中【languages】配置',
        ),
      );
      Logger.error(
        t('当前获取路径为：{{parsedLanguages}}', {
          parsedLanguages: i18nConf.parsedLanguages,
        }),
      );
    }
  }
}

function init() {
  program.version(pkg.version, '-v, --version');

  program
    .command('init')
    .description(t('初始化配置文件'))
    .option('-y, --yes', t('默认配置'))
    .action((cmdObj) => {
      const useDefaultConfig = cmdObj.yes;
      generateConfiguration(useDefaultConfig);
    });

  program
    .command('switch <language>')
    .description(t('设置 cli 语言'))
    .action((language) => {
      const i18nConf = parseI18nConf();
      if (i18nConf) {
        const { parsedLanguages } = i18nConf;
        if (parsedLanguages?.includes(language)) {
          const configFile = path.resolve(I18N_CONFIGURATION_FILE_NAME);
          const configuration = fse.readJSONSync(configFile, {
            encoding: 'utf8',
          });

          configuration.cliLang = language;
          fse.outputFileSync(configFile, formatJSON(configuration));

          Logger.success(t('已成功切换语言为：{{language}}', { language }));
          // `已成功切换语言为：${language}`);
        } else {
          // Logger.error(`目前支持只语言：${i18nConf.languages}`);
          Logger.error(
            t('目前支持只语言：{{languages}}', {
              languages: i18nConf.languages,
            }),
          );
        }
      }
    });

  program
    .command('scan [filePath]')
    .description(t('包裹 & 提取 & 自动翻译 & 统计翻译情况'))
    .option('-l, --language [language]', t('指定语言'))
    .option('-w, --wrap', t('包裹词条'))
    .option('-e, --extract', t('提取词条'))
    .option('-t, --translateSource', t('从源文件翻译'))
    .option('-tm, --translateMachine', t('机器翻译'))
    .option('-c, --count', t('统计翻译情况'))
    .option('-f, --file [file]', t('统计翻译情况'))
    .action((filePath: undefined | string, options) => {
      const { language, ...cmdObj } = options;
      scan(filePath, language, cmdObj);
    });

  program
    .command('wrap [filePath]')
    .description(t('包裹词条'))
    .action((filePath: string | undefined) => {
      scan(filePath, undefined, {
        wrap: true,
      });
    });

  program
    .command('check [filePath]')
    .description(t('检查词条是否被包裹'))
    .action((filePath: string | undefined) => {
      scan(filePath, undefined, {
        check: true,
      });
    });

  program
    .command('extract [filePath]')
    .description(t('提取词条'))
    .option('-l, --language [language]', t('指定语言'))
    .action((filePath: string | undefined, options) => {
      const { language } = options;
      scan(filePath, language, {
        extract: true,
      });
    });

  program
    .command('translate [language]')
    .option('-m, --machine', t('机器翻译'))
    .description(t('自动翻译'))
    .action((language: string | undefined, tansType: iTranType) => {
      const cmdConf = tansType.machine
        ? { translateMachine: true }
        : { translateSource: true };

      scan(undefined, language, cmdConf);
    });

  program
    .command('count [language]')
    .description(t('统计翻译情况'))
    .action((language: string | undefined) => {
      scan(undefined, language, {
        count: true,
      });
    });

  program
    .command('capture [language]')
    .description(t('网页截屏'))
    .action((language: string | undefined) => {
      Logger.info('coming soon');
    });

  program
    .command('checkTrans [language]')
    .description(t('翻译检查'))
    .action((language: string | undefined) => {
      Logger.info('coming soon');
    });

  program.on('--help', () => {
    Logger.info(`
${t('详情参见：https：//github.com/wuqiang1985/i18n-helper')}`);
  });

  program.parse(process.argv);
}

init();
