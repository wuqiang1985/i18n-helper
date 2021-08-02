import fs from 'fs';
import path from 'path';

import { transformFileSync } from '@babel/core';
import prettier from 'prettier';
import _ from 'lodash';
import fse from 'fs-extra';

import i18nPlugin from './plugin/babelPlugin';
import { getMatchedFiles } from './util/fileHelper';
import Logger from './util/logger';
import { formatJSON } from './util/helper';
import { iTransInfo, iI18nConf } from './types';

const originalScanWordInfoList: any[] = [];

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

  // const distFilename = `${distPath}${path.basename(filename)}`;
  fs.writeFileSync(filename, code, 'utf8');
};

/**
 * 提取词条到翻译文件
 * @param wordInfoArray 扫描后得到的词条信息
 * @param i18nConfig i18n配置
 */
const extractWording = async (wordInfoArray: any[], i18nConf: iI18nConf) => {
  const { localeDir, transFileName, transFileExt, languages } = i18nConf;
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
  languages.split(',').map((lang) => {
    const transFile = `${path.resolve(
      localeDir,
      lang,
      transFileName,
    )}.${transFileExt}`;
    const isTransFilesExits = fs.existsSync(transFile);

    if (!isTransFilesExits) {
      // 翻译文件不存在，新建翻译文件，写入【新增】 key: ''
      scannedWordings.map((key) => {
        obj[key] = '';
      });

      fse.outputFileSync(transFile, formatJSON(obj));
    } else {
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
        Logger.success('词条提取成功！');
      } else {
        Logger.success('本次无词条变动！');
      }
    }
  });
};

/**
 * 包裹词条
 * @param files 需要执行包裹词条的文件
 * @param i18nConf 18n配置
 */
const wrap = (files: string[], i18nConf: iI18nConf): void => {
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
      if (needTranslate) {
        generateFile(transInfo, code, filename, i18nConf);
        originalScanWordInfoList.push(transInfo.wordInfoArray);
      }
    }
  });

  if (originalScanWordInfoList.length > 0) {
    extractWording(originalScanWordInfoList, i18nConf);
  } else {
    console.log('...');
  }

  Logger.success('文件包裹已完成！');
};

/**
 * 包裹 & 提取词条
 * @param filePath 需要包裹词条路径
 * @param i18nConfig i18n配置
 */
const run = (filePath: string, i18nConf: iI18nConf): void => {
  Logger.info('开始包裹词条');
  const start = process.hrtime.bigint();
  fs.stat(filePath, (err, stat): void => {
    if (err) {
      Logger.error('【路径错误】，请检查路径');
      Logger.error(err.message);
      return;
    }

    const files = getMatchedFiles(filePath, stat, i18nConf);
    if (files.length > 0) {
      wrap(files, i18nConf);
      const end = process.hrtime.bigint();

      Logger.info(`耗时：${(end - start) / 1000000n}ms`);
    } else {
      Logger.warning('【该目录下不存在指定文件】，请检查路径');
    }
  });
};

export default run;
