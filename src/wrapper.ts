import fs from 'fs';
import path from 'path';

import { transformFileSync } from '@babel/core';
import prettier from 'prettier';
import _ from 'lodash';

import i18nPlugin from './plugin/babelPlugin';
import { getMatchedFiles } from './util/fileHelper';
import Logger from './util/logger';
import { formatJSON } from './util/helper';
import { iTransInfo } from './types';

const distPath = `${__dirname}/dist/`;

const IMPORT_STR = `import { Trans, useTranslation, Translation, withTranslation } from 'react-i18next';\n`;
const wordingList: any[] = [];

const wrapperFile = (
  transInfo: iTransInfo,
  code: string,
  filename: string,
  // wordingList: [],
) => {
  if (transInfo.needImport) {
    code = `${IMPORT_STR}${code}`;
  }
  code = prettier.format(code, {
    parser: 'babel',
    singleQuote: true,
  });

  const distFilename = `${distPath}${path.basename(filename)}`;
  fs.writeFileSync(distFilename, code, 'utf8');
};

const extractWording = (wordInfoArray: any[]) => {
  const dest = `${__dirname}/dist/message.json`;
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
  const wordingKeys = Object.keys(groupedWordList);
  const isTransFilesExits = false;
  const obj: any = {};

  if (isTransFilesExits) {
    wordingKeys.map((key) => {
      obj[key] = '';
    });

    fs.writeFileSync(dest, formatJSON(obj), 'utf8');
  } else {
    import('./dist/message.json').then((file) => {
      const existWording = Object.keys(file);
      existWording.pop();
      const newWroding = _.difference(wordingKeys, existWording);
      // console.log(newWroding);
      if (newWroding.length > 0) {
        wordingKeys.map((key) => {
          obj[key] = '';
        });
        fs.writeFileSync(dest, formatJSON(obj), 'utf8');
        Logger.success('词条提取成功！');
      } else {
        Logger.success('本次无词条变动！');
      }
    });
  }
};

const wrap = (files: string[]): void => {
  files.forEach((filename) => {
    const transInfo: iTransInfo = {
      needT: false,
      needTrans: false,
      needImport: true,
      wordInfoArray: [],
    };
    const plugin = i18nPlugin(transInfo);
    const transResult = transformFileSync(filename, {
      plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }], plugin],
    });

    if (transResult) {
      const code = transResult.code as string;
      const needTranslate = transInfo.needT || transInfo.needTrans;
      if (needTranslate) {
        wrapperFile(transInfo, code, filename);
        wordingList.push(transInfo.wordInfoArray);
      }
    }
  });

  if (wordingList.length > 0) {
    extractWording(wordingList);
  }

  Logger.success('文件包裹已完成！');
};

const run = (filePath: string): void => {
  Logger.info('开始包裹词条');
  const start = process.hrtime.bigint();
  fs.stat(filePath, (err, stat): void => {
    if (err) {
      Logger.error('【路径错误】，请检查路径');
      Logger.error(err.message);
      return;
    }

    const files = getMatchedFiles(filePath, stat);
    if (files.length > 0) {
      wrap(files);
      const end = process.hrtime.bigint();

      Logger.info(`耗时：${(end - start) / 1000000n}ms`);
    } else {
      Logger.warning('【该目录下不存在指定文件】，请检查路径');
    }
  });
};

export default run;
