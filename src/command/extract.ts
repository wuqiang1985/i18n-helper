import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import fse from 'fs-extra';

import Logger from '../util/logger';
import { formatJSON } from '../util/helper';
import { iI18nConf, iExtractResult, iTransObj } from '../types';

/**
 * 获取扫描后去重词条
 * @param originalScannedWordInfo 扫描后的词条信息
 * @returns 去重词条
 */
const getScannedUniqueKeys = (originalScannedWordInfo: any[]) => {
  const wordList = _.flattenDeep(originalScannedWordInfo);
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
  const scannedUniqueKeys = Object.keys(groupedWordList);

  return scannedUniqueKeys;
};

/**
 * 写入词条到翻译文件
 * @param targetLang 目标语言
 * @param sourceLang 源语言
 * @param transFile 翻译文件
 * @param AUWordings 变化的词条
 * @param extractResult 翻译结果
 * @param existObj 翻译文件存量词条
 */
const fillTransFile = (
  targetLang: string,
  sourceLang: string,
  transFile: string,
  AUWordings: string[],
  extractResult: iExtractResult,
  existObj?: iTransObj,
) => {
  let extractWordingCount = 0;
  let newTransObj;

  if (AUWordings.length > 0) {
    // 词条新增或修改词条对象
    const AUObj: iTransObj = {};
    AUWordings.map((key) => {
      AUObj[key] = targetLang === sourceLang ? key : '';
      extractWordingCount += 1;
    });

    if (existObj) {
      newTransObj = { ...existObj, ...AUObj };
    } else {
      newTransObj = AUObj;
    }
    extractResult[targetLang] = extractWordingCount;

    fse.outputFileSync(transFile, formatJSON(newTransObj));
    Logger.success(`【提取】【${targetLang}】词条提取已完成！`);
  } else {
    Logger.warning(`【提取】【${targetLang}】本次无词条变动！`);
  }
};

/**
 * 提取词条到翻译文件
 * @param originalScannedWordInfo 扫描后得到的词条信息
 * @param i18nConfig i18n配置
 */
const extractWording = (
  originalScannedWordInfo: any[],
  i18nConf: iI18nConf,
): iExtractResult => {
  // 提取结果
  const extractResult: iExtractResult = { EXTRACT_FILE: 0 };
  const {
    localeDir,
    transFileName,
    transFileExt,
    parsedLanguages,
    sourceLanguage,
  } = i18nConf;

  const scannedWordings = getScannedUniqueKeys(originalScannedWordInfo);

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
      const existObj = fse.readJSONSync(transFile);
      const existWording = Object.keys(existObj);
      // 新增和修改的词条
      const AUWordings = _.difference(scannedWordings, existWording);

      fillTransFile(
        lang,
        sourceLanguage,
        transFile,
        AUWordings,
        extractResult,
        existObj,
      );
    } else {
      // 翻译文件不存在，新建翻译文件，写入【新增】 key: ''
      let sourceTransKeys: string[] = [];

      const sourceTransFile = `${path.resolve(
        localeDir,
        sourceLanguage,
        transFileName,
      )}.${transFileExt}`;
      const isSourceTransFilesExited = fs.existsSync(sourceTransFile);
      if (isSourceTransFilesExited) {
        sourceTransKeys = Object.keys(fse.readJSONSync(sourceTransFile));
      }

      fillTransFile(
        lang,
        sourceLanguage,
        transFile,
        _.uniq([...sourceTransKeys, ...scannedWordings]),
        extractResult,
      );
    }
  });

  return extractResult;
};

export default extractWording;
