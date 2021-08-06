import path from 'path';
import fs from 'fs';

import fse from 'fs-extra';

import Logger from '../util/logger';
import { formatJSON } from '../util/helper';
import { iI18nConf } from '../types';

/**
 * 从人工翻译词条翻译
 * @param languages 指定语言，多个用,分开
 * @param i18nConf i18n 配置对象
 */
const translate = (languages: string | string[], i18nConf: iI18nConf): void => {
  const {
    localeDir,
    transFileName,
    transFileExt,
    targetTransDir,
    targetTransFile,
  } = i18nConf;
  const translationStatistics: any = {};
  const transFileMissed: string[] = [];
  const curLanguages =
    typeof languages === 'string' ? languages.split(',') : languages;

  curLanguages.map((lang) => {
    // 待翻译文件
    const transFile = `${path.resolve(
      localeDir,
      lang,
      transFileName,
    )}.${transFileExt}`;

    // 人工翻译源文件
    const targetTranslateFile = `${path.resolve(
      targetTransDir,
      lang,
      targetTransFile,
    )}`;

    const isTransFilesExited = fs.existsSync(transFile);
    const isTargetTranslateFileExited = fs.existsSync(targetTranslateFile);
    // 翻译词条数
    let transCount = 0;

    if (isTransFilesExited && isTargetTranslateFileExited) {
      const source = fse.readJSONSync(transFile);
      const target = fse.readJSONSync(targetTranslateFile);

      const unTranslatedWord = Object.fromEntries(
        Object.entries(source).filter(([key, value]) => value === ''),
      );
      const unTransKeys = Object.keys(unTranslatedWord);

      if (unTransKeys.length > 0) {
        // 未翻译的词条用翻译词库中的填充
        unTransKeys.map((key) => {
          const transValue =
            typeof target[key] === 'undefined' ? '' : target[key];
          if (transValue) {
            transCount += 1;
          }

          source[key] = transValue;
        });

        if (transCount > 0) {
          fse.outputFileSync(transFile, formatJSON(source));
          Logger.success(`【翻译】【${lang}】已完成！`);
        } else {
          Logger.warning(`【翻译】【${lang}】本次无词条被翻译！`);
        }
      }
    } else {
      transFileMissed.push(lang);
    }
  });
};

export default translate;
