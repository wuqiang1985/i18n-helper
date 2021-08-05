import fs from 'fs';

import { transformFileSync } from '@babel/core';
import prettier from 'prettier';

import extractWording from './extract';
import count from './count';
import i18nPlugin from '../plugin/babelPlugin';

import Logger from '../util/logger';

import { iTransInfo, iI18nConf, iCmd } from '../types';

const originalScanWordInfoList: any[] = [];
let generateFileCount = 0;

/**
 * 生成包裹词条的文件
 * @param transInfo 扫码后得到的翻译信息
 * @param code 包裹后生成的代码
 * @param filename 生成的文件名
 * @param i18nConfig i18n配置
 */
const generateFile = (
  transInfo: iTransInfo,
  code: string,
  filename: string,
  i18nConf: iI18nConf,
) => {
  if (transInfo.needImport) {
    code = `${i18nConf.importStr}${code}`;
  }
  code = prettier.format(code, {
    parser: 'babel',
    singleQuote: true,
  });

  fs.writeFileSync(filename, code, 'utf8');
};

/**
 * 包裹词条
 * @param files 需要执行包裹词条的文件
 * @param i18nConf 18n配置
 * @param cmdConf 命令配置
 */
const wrap = (files: string[], i18nConf: iI18nConf, cmdConf: iCmd): void => {
  files.forEach((filename) => {
    const transInfo: iTransInfo = {
      needT: false,
      needTrans: false,
      needImport: true,
      wordInfoArray: [],
    };
    const plugin = i18nPlugin(transInfo, i18nConf);
    const transResult = transformFileSync(filename, {
      plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }], plugin],
    });

    if (transResult) {
      const code = transResult.code as string;
      const needTranslate = transInfo.needT || transInfo.needTrans;

      // wordInfoArray 包含2个部分
      // 1. 未被包裹的中文词条
      // 2. 被 t 包裹后的 中文词条 (不包含这部分的话在包裹后无法提取词条)
      if (transInfo.wordInfoArray.length > 0) {
        originalScanWordInfoList.push(transInfo.wordInfoArray);
      }

      if (needTranslate) {
        if (cmdConf.wrap) {
          generateFileCount += 1;
          generateFile(transInfo, code, filename, i18nConf);
        }
      }
    }
  });

  if (generateFileCount > 0) {
    Logger.success('【包裹】词条包裹已完成！');
  } else if (cmdConf.wrap) {
    Logger.warning('【包裹】本次无词条被包裹！');
  }

  if (originalScanWordInfoList.length > 0 && cmdConf.extract) {
    extractWording(originalScanWordInfoList, i18nConf, cmdConf);
  } else if (cmdConf.count) {
    count(i18nConf.parsedLanguages as string[], i18nConf);
  }
};

export default wrap;
