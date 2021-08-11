module.exports = {
  // 项目类型：react | vue | js
  projectType: '[react]',
  // 默认包裹和提取词条的目录
  srcPath: './',
  // 扫描文件格式
  fileExt: 'js,jsx,ts,tsx',
  // 包裹词条的名字
  wrapperFuncName: 't',
  // jsx中的文字包裹方式，true用<trans></trans>， false用【wrapperFuncName】的value包裹
  jsx2Trans: false,
  // 当文件需要翻译时引入的文件
  importStr: `import { Trans, useTranslation, Translation, withTranslation } from 'react-i18next';\n`,
  // 排除目录，此目录下的不会不会执行包裹和提取词条操作
  exclude: 'node_modules,dist,git',
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
  targetTransDir: './src/translations',
  // 翻译词库文件名
  targetTransFile: 'transLib.json',
  // 腾讯云 secretId
  secretId: '',
  // 腾讯云 secretKey
  secretKey: '',
};
