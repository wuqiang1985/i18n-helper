import { getMatchedFiles, FilterFilesByExclude } from '../src/util/fileHelper';
import { iI18nConf } from '../src/types';

let conf: iI18nConf = {
  cliLang: 'en',
  srcPath: './src',
  fileExt: 'ts,js',
  gitModel: false,
  wrapCharacter: '[\u4e00-\u9fa5]',
  wrapperFuncName: 't',
  excludeWrapperFuncName: 'Logger.appendFile',
  jsx2Trans: false,
  importStr: "import i18n from '../i18n'\n",
  format: 'Prettier',
  exclude: 'node_modules,dist,git',
  localeDir: './src/locales',
  languages: 'zh,en',
  sourceLanguage: 'zh',
  transFileName: 'translation',
  transFileExt: 'json',
  targetTransDir: './src/translations',
  targetTransFile: 'transLib.json',
  secretId: '',
  secretKey: '',
  projectType: '',
  parsedImportKey: '',
  parsedExcludeWrapperFuncNameRegex: /console/,
  parsedPath: './',
  parsedExclude: ['node_modules', 'dist'],
};

describe('getMatchedFiles', () => {
  it('绝对路径 - react demo下 3 个文件需要包裹', () => {
    conf = {
      ...conf,
      parsedPath: `${process.cwd()}/examples/react-demo`,
      parsedExclude: [
        'node_modules',
        'dist',
        'i18n.js',
        'src/setupTests.js',
        'r*.js',
      ],
    };

    const files = getMatchedFiles(conf);
    expect(files.length).toEqual(3);
  });

  it('相对路径 - react demo下 3 个文件需要包裹', () => {
    conf = {
      ...conf,
      parsedPath: './examples/react-demo',
      parsedExclude: [
        'node_modules',
        'dist',
        'i18n.js',
        'src/setupTests.js',
        'r*.js',
      ],
    };

    const files = getMatchedFiles(conf);
    expect(files.length).toEqual(3);
  });

  it('git 模式 - 根据 exclude 中的路径或文件过滤', () => {
    const parsedExclude = ['src/util', 'src/config', 'src/command/scan.ts'];
    const changedFiles = [
      'src/config/i18n.default.config.ts',
      'src/command/count.ts',
      'src/command/scan.ts',
      'src/util/logger.ts',
      'src/util/helper.ts',
      'src/plugin/babelPlugin.ts',
    ];

    const files = FilterFilesByExclude(parsedExclude, changedFiles);
    expect(files.sort()).toEqual(
      ['src/command/count.ts', 'src/plugin/babelPlugin.ts'].sort(),
    );
  });
});
