import path from 'path';
import fs from 'fs';

import fse from 'fs-extra';

import Logger from '../util/logger';
import { iI18nConf, iExtractResult, iActionResult } from '../types';
import { ACTION_STATISTICS } from '../config/const';

const countActionResult = (
  action: 'wrap' | 'extract' | 'translate',
  actionResult: iActionResult,
  humanStatistics: Record<string, any>,
): void => {
  const { title, time } = ACTION_STATISTICS[action];
  const actionValues = Object.values(actionResult);
  const actionFileCount = actionValues.length - 1;
  const actionWordCount = actionValues.reduce((total, num) => {
    return total + num;
  });

  humanStatistics[title] = {
    文件: actionFileCount,
    词条: actionWordCount,
    预计节省人力: `${actionWordCount * time}s`,
  };
};

/**
 * 统计包裹结果信息
 * @param wrapInfo 包裹结果信息
 * @param humanStatistics 人力耗时信息
 */
const countWrap = (
  wrapInfo: Record<string, number>,
  humanStatistics: Record<string, any>,
): void => {
  countActionResult('wrap', wrapInfo, humanStatistics);
};

const countExtract = (
  extractInfo: iExtractResult,
  humanStatistics: Record<string, any>,
): void => {
  countActionResult('extract', extractInfo, humanStatistics);
};

/**
 * 统计词条翻译情况
 * @param languages 指定语言，多个用,分开
 * @param i18nConf i18n 配置对象
 */
const countTranslation = (
  languages: string | string[],
  i18nConf: iI18nConf,
): void => {
  const { localeDir, transFileName, transFileExt, sourceLanguage } = i18nConf;
  const translationStatistics: any = {};
  const transFileMissed: string[] = [];
  const curLanguages =
    typeof languages === 'string' ? languages.split(',') : languages;

  curLanguages.map((lang) => {
    const transFile = `${path.resolve(
      localeDir,
      lang,
      transFileName,
    )}.${transFileExt}`;
    const isTransFilesExited = fs.existsSync(transFile);

    if (isTransFilesExited) {
      const translation = fse.readJSONSync(transFile, { throws: false }) || {};
      const displayLanguage =
        lang === sourceLanguage ? `${lang} (source)` : lang;

      const totalKeyCount = Object.keys(translation).length;
      const unTranslatedCount = Object.values(translation).filter(
        (val) => val === '',
      ).length;

      translationStatistics[displayLanguage] = {
        总词条数: totalKeyCount,
        未翻译词条数: unTranslatedCount,
        未翻译比例: `${((unTranslatedCount / totalKeyCount) * 100).toFixed(
          2,
        )}%`,
      };
    } else {
      transFileMissed.push(lang);
      translationStatistics[lang] = {
        总词条数: '-',
        未翻译词条数: '-',
        未翻译比例: '-',
      };
    }
  });

  Logger.success('【统计】翻译统计已完成，详情如下');
  console.table(translationStatistics);

  if (transFileMissed.length > 0) {
    Logger.error(
      `【语言错误】${transFileMissed.join(',')} 不存在。
请检查命令行【count】后的路径 或 i18n.config.json 中【languages】配置`,
    );
  }
};

export { countTranslation, countWrap, countExtract, countActionResult };
