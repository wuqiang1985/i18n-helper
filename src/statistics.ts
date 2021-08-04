import path from 'path';
import fs from 'fs';

import fse from 'fs-extra';

import Logger from './util/logger';
import { iI18nConf } from './types';

/**
 * 统计词条翻译情况
 * @param languages 指定语言，多个用,分开
 * @param i18nConf i18n 配置对象
 */
const count = (languages: string, i18nConf: iI18nConf): void => {
  const { localeDir, transFileName, transFileExt } = i18nConf;
  const translationStatistics: any = {};
  const transFileMissed: string[] = [];

  languages.split(',').map((lang) => {
    const transFile = `${path.resolve(
      localeDir,
      lang,
      transFileName,
    )}.${transFileExt}`;
    const isTransFilesExited = fs.existsSync(transFile);

    if (isTransFilesExited) {
      const translation = fse.readJSONSync(transFile);

      // console.log(translation);
      const totalKeyCount = Object.keys(translation).length;
      const unTranslatedCount = Object.values(translation).filter(
        (val) => val === '',
      ).length;

      translationStatistics[lang] = {
        total: totalKeyCount,
        miss: unTranslatedCount,
        missRate: `${((unTranslatedCount / totalKeyCount) * 100).toFixed(2)}%`,
      };
    } else {
      transFileMissed.push(lang);
      translationStatistics[lang] = {
        total: '-',
        miss: '-',
        missRate: '-',
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

export default count;
