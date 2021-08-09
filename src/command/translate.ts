import path from 'path';
import fs from 'fs';

import fse from 'fs-extra';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';

import Logger from '../util/logger';
import { formatJSON } from '../util/helper';
import { iI18nConf, TransType, iActionResult } from '../types';

/**
 * 从人工翻译词条翻译
 * @param languages 指定语言，多个用,分开
 * @param i18nConf i18n 配置对象
 */
const translateSourceFile = (
  unTranslateKeys: string[],
  i18nConf: iI18nConf,
  lang: string,
  source: any,
) => {
  let transCount = 0;
  const { targetTransDir, targetTransFile } = i18nConf;
  // 人工翻译源文件
  const targetTranslateFile = `${path.resolve(
    targetTransDir,
    lang,
    targetTransFile,
  )}`;
  const isTargetTranslateFileExited = fs.existsSync(targetTranslateFile);

  if (isTargetTranslateFileExited) {
    const target =
      fse.readJSONSync(targetTranslateFile, { throws: false }) || {};

    unTranslateKeys.map((key) => {
      const transValue = typeof target[key] === 'undefined' ? '' : target[key];
      if (transValue) {
        transCount += 1;
      }

      source[key] = transValue;
    });
  } else {
    Logger.error(`【翻译错误】': 翻译文件${targetTranslateFile}不存在
请检查命令行【translate】后的语言 或 i18n.config.json 中配置`);
  }

  return transCount;
};

const translateTMT = async (
  targetLang: string,
  unTranslateKeys: string[],
  i18nConf: iI18nConf,
  source: any,
) => {
  let transCount = 0;
  const TMTClient = tencentcloud.tmt.v20180321.Client;
  const clientConfig = {
    // 腾讯云认证信息
    credential: {
      secretId: i18nConf.secretId,
      secretKey: i18nConf.secretKey,
    },
    // 产品地域
    region: 'ap-shanghai',
    // 可选配置实例
    profile: {
      signMethod: 'HmacSHA256', // 签名方法
      httpProfile: {
        reqMethod: 'POST', // 请求方法
        reqTimeout: 30, // 请求超时时间，默认60s
      },
    },
  };

  // 实例化要请TMT的client对象
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const client = new TMTClient(clientConfig);

  const { TargetTextList } = await client.TextTranslateBatch({
    // 自动识别（识别为一种语言）
    Source: 'auto',
    // 目标语言
    Target: targetLang,
    ProjectId: 0,
    // 待翻译词条
    SourceTextList: unTranslateKeys,
  });

  const transObj: any = {};
  if (TargetTextList) {
    for (let i = 0; i < unTranslateKeys.length; i += 1) {
      transObj[unTranslateKeys[i]] = TargetTextList[i];
    }
  }

  unTranslateKeys.map((key) => {
    const transValue =
      typeof transObj[key] === 'undefined' ? '' : transObj[key];
    if (transValue) {
      transCount += 1;
    }

    source[key] = transValue;
  });

  return transCount;
};
const translate = async (
  languages: string | string[],
  i18nConf: iI18nConf,
  transType: TransType,
): Promise<iActionResult> => {
  const transResult: iActionResult = { TRANSLATE_FILE: 0 };
  const tranTypeWording =
    transType === TransType.SourceFile
      ? '【翻译 - 从源文件翻译】'
      : '【翻译 - TMT机器翻译】';
  const { localeDir, transFileName, transFileExt } = i18nConf;
  const curLanguages =
    typeof languages === 'string' ? languages.split(',') : languages;

  await Promise.all(
    curLanguages.map(async (lang) => {
      // 翻译词条数
      let transCount = 0;
      // 待翻译文件
      const transFile = `${path.resolve(
        localeDir,
        lang,
        transFileName,
      )}.${transFileExt}`;
      const isTransFilesExited = fs.existsSync(transFile);

      if (isTransFilesExited) {
        const source = fse.readJSONSync(transFile);

        const unTranslatedWord = Object.fromEntries(
          Object.entries(source).filter(([key, value]) => value === ''),
        );
        const unTransKeys = Object.keys(unTranslatedWord);

        if (unTransKeys.length > 0) {
          // 有词条需要翻译
          if (transType === TransType.SourceFile) {
            transCount = translateSourceFile(
              unTransKeys,
              i18nConf,
              lang,
              source,
            );
          } else {
            transCount = await translateTMT(
              lang,
              unTransKeys,
              i18nConf,
              source,
            );
          }
          if (transCount > 0) {
            transResult[lang] = transCount;
            fse.outputFileSync(transFile, formatJSON(source));
            Logger.success(`${tranTypeWording}【${lang}】已完成！`);
          } else {
            Logger.warning(`${tranTypeWording}【${lang}】本次无词条被翻译！`);
          }
        } else {
          Logger.warning(`${tranTypeWording}【${lang}】本次没有词条需要翻译！`);
        }
      } else {
        Logger.error(`【翻译错误】': 待翻译文件${transFile}不存在
请检查命令行【translate】后的语言 或 i18n.config.json 中【languages】配置`);
      }
    }),
  );

  return transResult;
};

export default translate;
