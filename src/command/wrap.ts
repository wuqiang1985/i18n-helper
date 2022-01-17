import fs from 'fs';

import { transformFileSync } from '@babel/core';
import prettier from 'prettier';

import { t } from '../i18n';
import i18nPlugin from '../plugin/babelPlugin';
import Logger from '../util/logger';
import { iTransInfo, iWordInfo, iI18nConf, iCmd, iWrapResult } from '../types';

const originalScanWordInfoList: iWordInfo[][] = [];
let generateFileCount = 0;

/**
 * 生成包裹词条的文件
 * @param transInfo 扫描后得到的翻译信息
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

  // TODO: 这里应该读取本地Prettier配置
  code = prettier.format(code, {
    parser: 'typescript',
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
const wrap = (
  files: string[],
  i18nConf: iI18nConf,
  cmdConf: Partial<iCmd>,
): iWrapResult => {
  const wrapResult: iWrapResult = { wrapInfo: { WRAP_FILE: 0 } };
  files.forEach((filename) => {
    const transInfo: iTransInfo = {
      needT: false,
      needTrans: false,
      needImport: true,
      wordInfoArray: [],
      wrapCount: 0,
    };
    const plugin = i18nPlugin(transInfo, i18nConf);
    const transResult = transformFileSync(filename, {
      plugins: [
        ['@babel/plugin-syntax-typescript', { isTSX: true }],
        // ['@babel/plugin-proposal-decorators', { legacy: true }],
        // ['@babel/plugin-proposal-class-properties', { loose: true }],
        plugin,
      ],
      retainLines: true,
      configFile: false,
      babelrc: false,
    });

    if (transResult) {
      const code = transResult.code as string;
      const needTranslate = transInfo.needT || transInfo.needTrans;
      // wordInfoArray 包含2个部分
      // 1. 未被包裹的中文词条
      // 2. 被 t 包裹后的 中文词条 (不包含这部分的话在包裹后无法提取词条)
      if (transInfo.wordInfoArray.length > 0) {
        originalScanWordInfoList.push(transInfo.wordInfoArray);
        wrapResult.originalScanWordInfoLit = originalScanWordInfoList;
      }

      if (needTranslate) {
        if (cmdConf.wrap) {
          wrapResult.wrapInfo[filename] = transInfo.wrapCount;
          generateFileCount += 1;
          generateFile(transInfo, code, filename, i18nConf);
        }
      }
    }
  });

  if (generateFileCount > 0) {
    Logger.success(t('【包裹】词条包裹已完成！'));
  } else if (cmdConf.wrap) {
    Logger.warning(t('【包裹】本次无词条被包裹！'));
  }

  return wrapResult;
};

export default wrap;
