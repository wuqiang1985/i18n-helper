module.exports = {
  // cli 语言
  cliLang: 'zh',
  // 项目类型：react | vue | js
  projectType: '[react]',
  // 默认包裹和提取词条的目录
  srcPath: './',
  // 扫描文件格式
  fileExt: 'js,ts,tsx',
  // 包裹的字符集，下面是中文
  wrapCharacter: '[\u4e00-\u9fa5]',
  // git 模式，只处理新增和修改文件
  gitModel: false,
  // 包裹词条的名字
  wrapperFuncName: 't',
  // 忽略掉包裹的方法，多个用,分隔
  excludeWrapperFuncName: '^console,indexOf,split',
  // jsx中的文字包裹方式，true用<trans></trans>， false用【wrapperFuncName】的value包裹
  jsx2Trans: false,
  // 当文件需要翻译时引入的文件
  importStr: `import {t} from './i18n;';\n`,
  // 排除目录，此目录下的不会不会执行包裹和提取词条操作
  exclude: 'node_modules,dist,.git',
  // 格式化方式
  format: 'Prettier',
  // 翻译词条目录
  localeDir: './locales',
  // 翻译语种
  languages: 'zh,en',
  // 源语言
  sourceLanguage: 'zh',
  // 翻译词条文件名
  transFileName: 'translation',
  // 翻译词条文件格式: json, po
  transFileExt: 'json',
  // 翻译词库目录（自动翻译目录）
  targetTransDir: './translations',
  // 翻译词库文件名
  targetTransFile: 'sourceTranslation.json',
  // 腾讯云 secretId
  secretId: '',
  // 腾讯云 secretKey
  secretKey: '',
};
