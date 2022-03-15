import fs from 'fs';

import { transformFileSync } from '@babel/core';
import prettier from 'prettier';
import { ESLint } from 'eslint';

import { t } from '../i18n';
import i18nPlugin from '../plugin/babelPlugin';
import Logger from '../util/logger';
import { iTransInfo, iWordInfo, iI18nConf, iCmd, iWrapResult } from '../types';

const originalScanWordInfoList: iWordInfo[][] = [];
let generateFileCount = 0;

const eslintFormat = async (filePath: string) => {
  const eslint = new ESLint({ fix: true });
  const results = await eslint.lintFiles(filePath);
  await ESLint.outputFixes(results);
};

/**
 * 生成包裹词条的文件
 * @param transInfo 扫描后得到的翻译信息
 * @param code 包裹后生成的代码
 * @param filename 生成的文件名
 * @param i18nConfig i18n配置
 */
const generateFile = async (
  transInfo: iTransInfo,
  code: string,
  filename: string,
  i18nConf: iI18nConf,
) => {
  if (transInfo.needImport) {
    code = `${i18nConf.importStr}${code}`;
  }

  if (i18nConf.format === 'Prettier') {
    code = prettier.format(code, {
      parser: 'typescript',
      ...i18nConf.parsedPrettierConfig,
    });

    fs.writeFileSync(filename, code, 'utf8');
  } else {
    fs.writeFileSync(filename, code, 'utf8');
    await eslintFormat(filename);
  }
};
/**
 * 包裹词条
 * @param files 需要执行包裹词条的文件
 * @param i18nConf 18n配置
 * @param cmdConf 命令配置
 */
const wrap = async (
  files: string[],
  i18nConf: iI18nConf,
  cmdConf: Partial<iCmd>,
): Promise<iWrapResult> => {
  const wrapResult: iWrapResult = { wrapInfo: { WRAP_FILE: 0 } };
  let failCount = 0;

  files.forEach((filename) => {
    const transInfo: iTransInfo = {
      needT: false,
      needTrans: false,
      needImport: true,
      wordInfoArray: [],
      wrapCount: 0,
      wrapSuccess: true,
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
      const needWrap = transInfo.needT || transInfo.needTrans;
      // wordInfoArray 包含2个部分
      // 1. 未被包裹的中文词条
      // 2. 被 t 包裹后的 中文词条 (不包含这部分的话在包裹后无法提取词条)
      if (transInfo.wordInfoArray.length > 0) {
        originalScanWordInfoList.push(transInfo.wordInfoArray);
        wrapResult.originalScanWordInfoLit = originalScanWordInfoList;
      }

      if (needWrap) {
        if (cmdConf.wrap || cmdConf.check) {
          wrapResult.wrapInfo[filename] = transInfo.wrapCount;
          generateFileCount += 1;
          if (cmdConf.wrap) {
            generateFile(transInfo, code, filename, i18nConf);
          }
        }
      }

      if (!transInfo.wrapSuccess) {
        failCount += 1;
      }
    }
  });

  if (cmdConf.wrap) {
    if (generateFileCount > 0) {
      Logger.success(t('【包裹】词条包裹已完成！'));
    } else {
      Logger.warning(t('【包裹】所有词条已被包裹，无需再次包裹！'));
    }

    if (failCount > 0) {
      Logger.warning(
        '【包裹】本次有词条包裹不成功，详情参见./i18n.error.log！',
      );
    }
  }

  if (cmdConf.check) {
    if (generateFileCount === 0) {
      Logger.success(t('【检查未翻译词条】恭喜，所有词条都已经包裹！'));
    } else {
      const words = Object.values(wrapResult.wrapInfo);
      const wordCount = words.reduce((total, num) => {
        return total + num;
      });
      Logger.error(
        t(
          `【检查未包裹词条】涉及【${generateFileCount}】文件，共有【${wordCount}】词条未包裹！详情如下表：`,
        ),
      );
    }
  }

  return wrapResult;
};

export default wrap;
