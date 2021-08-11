import fs from 'fs';

import wrap from './wrap';
import extractWording from './extract';
import { countTranslation, countActionResult } from './count';
import translate from './translate';
import { getMatchedFiles } from '../util/fileHelper';
import Logger from '../util/logger';
import { iI18nConf, iCmd, TransType, iWordInfo } from '../types';

const getCmdNames = (cmdConf: iCmd) => {
  const cmdObj = {
    wrap: '【包裹】',
    extract: '【提取】',
    translateSource: '【翻译 - 从源文件翻译】',
    translateMachine: '【翻译 - TMT机器翻译】',
    count: '【统计】',
  };
  const cmdNames: string[] = [];

  Object.keys(cmdConf).map((key) => {
    if (cmdConf[key as keyof iCmd]) {
      cmdNames.push(cmdObj[key as keyof iCmd]);
    }
  });

  return cmdNames.join(',');
};

/**
 * 根据命令包裹，提取，翻译，统计词条
 * @param filePath 需要包裹词条路径
 * @param i18nConfig i18n配置
 * @param cmdConf 命令配置
 */
const scan = (filePath: string, i18nConf: iI18nConf, cmdConf: iCmd): void => {
  // 一个参数都不填
  if (Object.values(cmdConf).every((value) => !value)) {
    Logger.error('【参数错误】请检scan后的参数 e.g i18n-helper scan -wetc');
    return;
  }

  fs.stat(filePath, async (err, stat): Promise<void> => {
    if (err) {
      Logger.error('【路径错误】，请检查路径');
      Logger.error(err.message);
      return;
    }

    const files = getMatchedFiles(filePath, stat, i18nConf);
    if (files.length > 0) {
      Logger.info(`开始 ${getCmdNames(cmdConf)}词条`);

      const start = process.hrtime.bigint();
      const humanStatistics: any = {};
      let originalScanWordInfoList: iWordInfo[][] = [];

      // 包裹还是提取词条都需要，因为要做语法树分析
      if (cmdConf.wrap || cmdConf.extract) {
        const wrapResult = wrap(files, i18nConf, cmdConf);
        originalScanWordInfoList =
          wrapResult.originalScanWordInfoLit as iWordInfo[][];
        const { wrapInfo } = wrapResult;

        if (cmdConf.wrap) {
          countActionResult('wrap', wrapInfo, humanStatistics);
        }
      }

      if (originalScanWordInfoList.length > 0 && cmdConf.extract) {
        const extractResult = extractWording(
          originalScanWordInfoList,
          i18nConf,
        );

        countActionResult('extract', extractResult, humanStatistics);
      }

      if (cmdConf.translateSource || cmdConf.translateMachine) {
        let transType;
        if (cmdConf.translateSource) {
          transType = TransType.SourceFile;
        } else {
          transType = TransType.TMT;
        }

        const tranResult = await translate(
          i18nConf.parsedLanguages as string[],
          i18nConf,
          transType,
        );
        countActionResult('translate', tranResult, humanStatistics);
      }

      if (cmdConf.count) {
        countTranslation(i18nConf.parsedLanguages as string[], i18nConf);
      }

      const end = process.hrtime.bigint();

      Logger.info(
        `结束${getCmdNames(cmdConf)}词条
耗时：${(end - start) / 1000000n}ms，详情如下`,
      );
      console.table(humanStatistics);
    } else {
      Logger.warning('【该目录下不存在指定文件】请检查路径');
    }
  });
};

export default scan;
