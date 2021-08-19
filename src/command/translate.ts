import path from 'path';
import fs from 'fs';

import fse from 'fs-extra';
import * as tencentCloud from 'tencentcloud-sdk-nodejs';

import { t } from '../i18n';
import Logger from '../util/logger';
import { formatJSON } from '../util/helper';
import { iI18nConf, TransType, iActionResult } from '../types';

/**
 * 从翻译词条数据源翻译
 * @param targetLang 目标翻译语言
 * @param unTranslateKeys 未翻译词条
 * @param i18nConf i18n 配置对象
 * @param source 目标翻译原
 * @returns 实际翻译词条数
 */
const translateFromSourceFile = (
  targetLang: string,
  unTranslateKeys: string[],
  i18nConf: iI18nConf,
  source: Record<string, string>,
) => {
  let transCount = 0;
  const { targetTransDir, targetTransFile } = i18nConf;
  // 人工翻译源文件
  const targetTranslateFile = `${path.resolve(
    targetTransDir,
    targetLang,
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
    Logger.error(
      t(
        '【翻译错误】翻译文件{{targetTranslateFile}}不存在 请检查命令行【translate】后的语言 或 i18n.config.json 中配置',
        {
          targetTranslateFile,
        },
      ),
    );
  }

  return transCount;
};
/**
 * 机器翻译（腾讯翻译君）
 * @param targetLang 目标翻译语言
 * @param unTranslateKeys 未翻译词条
 * @param i18nConf i18n 配置对象
 * @param source 目标翻译原
 * @returns 实际翻译词条数
 */
const translateFromTMT = async (
  targetLang: string,
  unTranslateKeys: string[],
  i18nConf: iI18nConf,
  source: Record<string, string>,
) => {
  const { secretId, secretKey } = i18nConf;

  if (!secretId && !secretKey) {
    Logger.error(
      t(
        '【翻译错误】secretId或secretKey不存在 请检查i18n.config.json 中【secretId】或【secretKey】配置',
      ),
    );
    return -1;
  }

  let transCount = 0;
  const TMTClient = tencentCloud.tmt.v20180321.Client;
  const clientConfig = {
    // 腾讯云认证信息
    credential: {
      secretId,
      secretKey,
    },
    // 产品地域
    region: 'ap-shanghai',
    // 可选配置实例
    profile: {
      signMethod: 'HmacSHA256',
      httpProfile: {
        reqMethod: 'POST',
        reqTimeout: 30,
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
  const transObj: Record<string, string> = {};
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
/**
 * 翻译词条
 * @param languages 目标翻译语言列表
 * @param i18nConf i18n 配置对象
 * @param transType 翻译方式
 * @returns 翻译结果信息
 */
const translate = async (
  languages: string | string[],
  i18nConf: iI18nConf,
  transType: TransType,
): Promise<iActionResult> => {
  const transResult: iActionResult = { TRANSLATE_FILE: 0 };
  const tranTypeWording =
    transType === TransType.SourceFile
      ? t('【翻译 - 从源文件翻译】')
      : t('【翻译 - TMT机器翻译】');
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
        // 有词条需要翻译
        if (unTransKeys.length > 0) {
          if (transType === TransType.SourceFile) {
            transCount = translateFromSourceFile(
              lang,
              unTransKeys,
              i18nConf,
              source,
            );
          } else {
            transCount = await translateFromTMT(
              lang,
              unTransKeys,
              i18nConf,
              source,
            );
          }
          // 翻译词条数大于 0
          if (transCount > 0) {
            transResult[lang] = transCount;
            fse.outputFileSync(transFile, formatJSON(source));
            Logger.success(
              t('{{tranTypeWording}}【{{lang}}】已完成！', {
                tranTypeWording,
                lang,
              }),
            );
          } else if (transCount === 0) {
            Logger.warning(
              t('{{tranTypeWording}}【{{lang}}】本次无词条被翻译！', {
                tranTypeWording,
                lang,
              }),
            );
          }
        } else {
          Logger.warning(
            t('{{tranTypeWording}}【{{lang}}】本次没有词条需要翻译！', {
              tranTypeWording,
              lang,
            }),
          );
        }
      } else {
        Logger.error(
          t(
            '【翻译错误】待翻译文件{{transFile}}不存在 请检查命令行【translate】后的语言 或 i18n.config.json 中【languages】配置',
            {
              transFile,
            },
          ),
        );
      }
    }),
  );
  return transResult;
};

export default translate;
