import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import fse from 'fs-extra';

import count from './count';
import Logger from '../util/logger';
import { formatJSON } from '../util/helper';
import { iI18nConf, iCmd } from '../types';

/**
 * 提取词条到翻译文件
 * @param wordInfoArray 扫描后得到的词条信息
 * @param i18nConfig i18n配置
 */
const extractWording = (
  wordInfoArray: any[],
  i18nConf: iI18nConf,
  cmdConf: iCmd,
): void => {
  const { localeDir, transFileName, transFileExt, parsedLanguages } = i18nConf;
  const wordList = _.flattenDeep(wordInfoArray);
  // groupedWordList 结构，按key聚合
  // {
  //   "武强": [
  //     {
  //       "key": "武强",
  //       "filename": "/Users/wuqiang/dev/study/mine/i18n/i18n-helper/src/test/index.js",
  //       "line": 9
  //     }
  //   ],
  // }
  const groupedWordList = _.chain(wordList).groupBy('key').value();
  // 本次词条扫描后得到的所有中文词条
  const scannedWordings = Object.keys(groupedWordList);
  const obj: any = {};

  // 遍历翻译文件
  parsedLanguages?.map((lang) => {
    const transFile = `${path.resolve(
      localeDir,
      lang,
      transFileName,
    )}.${transFileExt}`;
    const isTransFilesExited = fs.existsSync(transFile);

    if (isTransFilesExited) {
      // 翻译文件存在，修改翻译文件，写入 【修改】 & 【新增 】key: ‘’
      const transObj = fse.readJSONSync(transFile);
      const existWording = Object.keys(transObj);
      // 新增和修改的词条
      const AUWordings = _.difference(scannedWordings, existWording);
      if (AUWordings.length > 0) {
        AUWordings.map((key) => {
          obj[key] = '';
        });
        const newObj = { ...transObj, ...obj };

        fs.writeFileSync(transFile, formatJSON(newObj), 'utf8');
        Logger.success(`【提取】【${lang}】词条提取已完成！`);
      } else {
        Logger.warning(`【提取】【${lang}】本次无词条变动！`);
      }
    } else {
      // 翻译文件不存在，新建翻译文件，写入【新增】 key: ''
      scannedWordings.map((key) => {
        obj[key] = '';
      });

      fse.outputFileSync(transFile, formatJSON(obj));
      Logger.success(`【提取】【${lang}】词条提取已完成！`);
    }
  });

  if (cmdConf.count) {
    count(parsedLanguages as string[], i18nConf);
  }
};

export default extractWording;
