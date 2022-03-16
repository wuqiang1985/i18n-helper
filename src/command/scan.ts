import { t } from '../i18n';
import wrap from './wrap';
import extractWording from './extract';
import { countTranslation, countActionResult } from './count';
import translate from './translate';
import { getMatchedFiles } from '../util/fileHelper';
import Logger from '../util/logger';
import { iI18nConf, iCmd, TransType, iWordInfo } from '../types';

const getCmdNames = (cmdConf: Partial<iCmd>) => {
  const cmdObj = {
    wrap: t('【包裹】'),
    extract: t('【提取】'),
    translateSource: t('【翻译 - 从源文件翻译】'),
    translateMachine: t('【翻译 - TMT机器翻译】'),
    count: t('【统计】'),
    check: t('【检查未包裹词条】'),
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
 * @param i18nConfig i18n配置
 * @param cmdConf 命令配置
 */
const scan = async (
  i18nConf: iI18nConf,
  cmdConf: Partial<iCmd>,
): Promise<void> => {
  // 一个参数都不填
  if (Object.values(cmdConf).every((value) => !value)) {
    Logger.error(t('【参数错误】请检命令后的参数'));
    return;
  }

  const {
    wrap: isWrap,
    extract: isExtract,
    translateSource: isTranslateSource,
    translateMachine: isTranslateMachine,
    count: isCount,
    check: isCheck,
  } = cmdConf;
  const humanStatistics: any = {};
  const start = process.hrtime.bigint();

  Logger.info(
    t('【开始】-{{getCmdNames}}词条', {
      getCmdNames: getCmdNames(cmdConf),
    }),
  );
  Logger.info(
    '---------------------------------------------------------------------------------------------------',
  );

  try {
    if (isWrap || isExtract || isCheck) {
      // 包裹还是提取词条都需要，因为要做语法树分析
      const files = getMatchedFiles(i18nConf);
      const fileCount = files.length;

      Logger.info(
        t(
          '{{type}} - 本次将处理【{{srcPath}}】下文件扩展名为【{{fileExt}}】的文件，符合要求的文件【{{fileCount}}】个',
          {
            fileCount,
            srcPath: i18nConf.gitModel ? t('当前项目') : i18nConf.srcPath,
            fileExt: i18nConf.fileExt,
            type: i18nConf.gitModel ? t('【Git模式】') : t('【文件模式】'),
          },
        ),
      );

      if (fileCount > 0) {
        // 包裹词条
        let originalScanWordInfoList: iWordInfo[][] = [];
        const wrapResult = await wrap(files, i18nConf, cmdConf);
        originalScanWordInfoList =
          wrapResult.originalScanWordInfoLit as iWordInfo[][];
        const { wrapInfo } = wrapResult;

        if (isWrap) {
          countActionResult('wrap', wrapInfo, humanStatistics);
        }

        if (isCheck) {
          delete wrapInfo.WRAP_FILE;
          if (Object.values(wrapInfo).length > 0) {
            console.table(wrapInfo);
            process.exit(1);
          }
        }

        // 提取词条
        if (originalScanWordInfoList?.length > 0 && isExtract) {
          const extractResult = extractWording(
            originalScanWordInfoList,
            i18nConf,
          );
          countActionResult('extract', extractResult, humanStatistics);
        }
      } else {
        const message = i18nConf.gitModel
          ? t('【符合条件文件数为0】')
          : t('【符合条件文件数为0】请检查路径');
        Logger.warning(message);
      }
    }

    // 翻译词条
    if (isTranslateSource || isTranslateMachine) {
      let transType;

      if (isTranslateSource) {
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

    // 统计翻译情况
    if (isCount) {
      countTranslation(i18nConf.parsedLanguages as string[], i18nConf);
    }

    const end = process.hrtime.bigint();
    Logger.info(
      '---------------------------------------------------------------------------------------------------',
    );
    Logger.info(
      t('【结束】-{{getCmdNames}}词条，耗时：{{time}}ms', {
        getCmdNames: getCmdNames(cmdConf),
        time: (end - start) / 1000000n,
      }),
    );

    if (Object.keys(humanStatistics).length > 0) {
      Logger.info('\n节约工时预估，详情如下：');
      console.table(humanStatistics);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

export default scan;
