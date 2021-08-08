import fs from 'fs';

import wrap from './wrap';
import extractWording from './extract';
import count from './count';
import translate from './translate';
import { getMatchedFiles } from '../util/fileHelper';
import Logger from '../util/logger';
import {
  iI18nConf,
  iCmd,
  TransType,
  iWordInfo,
  iExtractResult,
} from '../types';

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

const getScanStatistics = (
  wrapInfo: Record<string, number>,
  extractInfo: iExtractResult,
) => {
  const wrapValues = Object.values(wrapInfo);
  const wrapFileCount = wrapValues.length - 1;
  const wrapWordCount = wrapValues.reduce((total, num) => {
    return total + num;
  });

  const extractValues = Object.values(extractInfo);
  const extractFileCount = extractValues.length - 1;
  const extractWordCount = Object.values(extractInfo).reduce((total, num) => {
    return total + num;
  });

  return { wrapFileCount, wrapWordCount, extractFileCount, extractWordCount };
};

const countHumanStatistics = (
  wrapInfo: Record<string, number>,
  extractInfo: iExtractResult,
  cmdConf: iCmd,
) => {
  const { wrapFileCount, wrapWordCount, extractFileCount, extractWordCount } =
    getScanStatistics(wrapInfo, extractInfo);

  const humanStatistics: any = {};

  humanStatistics['包裹'] = {
    文件: wrapFileCount,
    词条: wrapWordCount,
    预计节省人力: `${wrapWordCount * 2}s`,
  };

  humanStatistics['提取'] = {
    文件: extractFileCount,
    词条: extractWordCount,
    预计节省人力: `${extractWordCount * 3}s`,
  };

  Logger.info(`结束${getCmdNames(cmdConf)}已完成，详情如下：`);
  console.table(humanStatistics);
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

  let extractResult = {};

  Logger.info(`开始 ${getCmdNames(cmdConf)}词条`);
  const start = process.hrtime.bigint();

  fs.stat(filePath, async (err, stat): Promise<void> => {
    if (err) {
      Logger.error('【路径错误】，请检查路径');
      Logger.error(err.message);
      return;
    }

    const files = getMatchedFiles(filePath, stat, i18nConf);
    if (files.length > 0) {
      // 不管包裹还是提取词条都需要
      const wrapResult = wrap(files, i18nConf, cmdConf);
      const originalScanWordInfoList =
        wrapResult.originalScanWordInfoLit as iWordInfo[][];
      const { wrapInfo } = wrapResult;
      // console.log(wrapInfo);

      if (originalScanWordInfoList.length > 0 && cmdConf.extract) {
        extractResult = extractWording(originalScanWordInfoList, i18nConf);
      }

      // console.log(extractResult);

      if (cmdConf.translateSource) {
        translate(
          i18nConf.parsedLanguages as string[],
          i18nConf,
          TransType.SourceFile,
        );
      } else if (cmdConf.translateMachine) {
        await translate(
          i18nConf.parsedLanguages as string[],
          i18nConf,
          TransType.TMT,
        );
      }

      if (cmdConf.count) {
        count(i18nConf.parsedLanguages as string[], i18nConf);
      }

      const end = process.hrtime.bigint();
      // console.log(wrapInfo);
      countHumanStatistics(
        wrapInfo as Record<string, number>,
        extractResult,
        cmdConf,
      );

      Logger.info(`【完成】耗时：${(end - start) / 1000000n}ms`);
    } else {
      Logger.warning('【该目录下不存在指定文件】请检查路径');
    }
  });
};

export default scan;
