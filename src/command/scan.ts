import fs from 'fs';

import wrap from './wrap';
import { getMatchedFiles } from '../util/fileHelper';
import Logger from '../util/logger';
import { iI18nConf, iCmd } from '../types';

/**
 * 根据命令包裹，提取，翻译，统计词条
 * @param filePath 需要包裹词条路径
 * @param i18nConfig i18n配置
 * @param cmdConf 命令配置
 */
const scan = (filePath: string, i18nConf: iI18nConf, cmdConf: iCmd): void => {
  const cmdObj = {
    wrap: '【包裹】',
    extract: '【提取】',
    translate: '【翻译】',
    count: '【统计】',
  };
  const cmdNames: string[] = [];
  Object.keys(cmdConf).map((key) => {
    if (cmdConf[key as keyof iCmd]) {
      cmdNames.push(cmdObj[key as keyof iCmd]);
    }
  });

  Logger.info(`开始 ${cmdNames.join(',')}词条`);

  const start = process.hrtime.bigint();
  fs.stat(filePath, (err, stat): void => {
    if (err) {
      Logger.error('【路径错误】，请检查路径');
      Logger.error(err.message);
      return;
    }

    const files = getMatchedFiles(filePath, stat, i18nConf);
    if (files.length > 0) {
      wrap(files, i18nConf, cmdConf);
      const end = process.hrtime.bigint();

      Logger.info(`耗时：${(end - start) / 1000000n}ms`);
    } else {
      Logger.warning('【该目录下不存在指定文件】请检查路径');
    }
  });
};

export default scan;
