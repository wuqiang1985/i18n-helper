import { getMatchedFiles } from '../src/util/fileHelper';
import { iI18nConf } from '../src/types';

let conf: iI18nConf = {
  cliLang: 'en',
  srcPath: './src',
  fileExt: 'ts,js',
  wrapCharacter: '[\u4e00-\u9fa5]',
  wrapperFuncName: 't',
  excludeWrapperFuncName: 'Logger.appendFile',
  jsx2Trans: false,
  importStr: "import i18n from '../i18n'\n",
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
  parsedExcludeWrapperFuncName: [],
  parsedPath: './',
  parsedExclude: ['node_modules', 'dist'],
};

describe('getMatchedFiles', () => {
  it('绝对路径 - react demo下 3 个文件需要包裹', () => {
    conf = {
      ...conf,
      parsedPath:
        '/Users/wuqiang/dev/study/mine/i18n/i18n-helper/examples/react-demo',
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
});
