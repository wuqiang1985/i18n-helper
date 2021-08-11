# i18n-helper · ![NPM](https://img.shields.io/github/license/wuqiang1985/i18n-helper) ![npm](https://img.shields.io/npm/dy/i18n-helper) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## 背景

随着出海的业务越来越多，web 应用面临越来越多的国际化的工作。如何来做呢？简单来说可以分为以下 4 个步骤

1. 【选型】多语言框架选型（这里不深究，不在此篇范围），我们选定 [i18next](https://react.i18next.com/)
2. 【包裹词条】从上面这步骤，我们知道需要把词条包裹起来，比如 `t('你好')`
3. 【提取词条】把上一步中包裹的词条 copy 到翻译文件中
4. 【翻译】翻译把词条翻译好，完成国际化

## 问题

通过上面 4 步，可以完成站点国际化，一切看起来没啥问题。然而真的是这样吗？
让我们设想两种需要国际化的场景

1. 【全新开发】这种情况下，我们可以从容的编写每一个页面，模块，组件，增量的`包裹词条`，`提取词条`，`翻译词条`
2. 【存量修改】如果之前的页面有成百上。。。一个个文件去`包裹词条`，`提取词条`，`翻译词条`？

所以这里最大的问题是【包裹词条】和【提取词条】都是手工，如果全新开发，这两项烦人的工作似乎也不会让人崩溃，但如果需要把现有的站点国际化，同时面临很多页面。。。

## 目标

减少低效劳动，提高生活质量！！！

自动`包裹词条`，`提取词条`， `翻译词条`

## 安装

```shell
# npm 安装
npm install i18n-helper-cli -D
# yarn 安装
yarn add i18n-helper-cli —dev
```

## 使用方法

1. 在需要配置的根目录下，配置生成 i18n.config.json 文件

```shell
# 交互式命令行
i18n-helper init
# 生成默认配置文件，具体参见【配置说明】
i18n-helper init -y
```

2. 包裹 & 提取 & 翻译 & 翻译

```shell
# 包裹 & 提取 & 翻译 & 统计 i18n.config.json 中 srcPath 文件中的中文词条
# w:wrap e:extract t:translate tm: translate machine c:count
# 这 5 个操作可以随意组合 e.g. i18n-helper scan -we 则只会翻译 & 提取
i18n-helper scan -wetc
i18n-helper scan -we -tm -c
# 包裹 & 提取 & 翻译 & 统计 指定路径或文件内符合规则的词条
i18n-helper scan -wetc [path|filename]
i18n-helper scan -we -tm -c [path|filename]

# 包裹 i18n.config.json 中 srcPath 文件中的中文词条
i18n-helper wrap
i18n-helper scan -t
# 包裹指定文件中的中文词条
i18n-helper wrap [path|filename]
i18n-helper scan -t [path|filename]

# 提取 i18n.config.json 中 srcPath 文件中的中文词条
i18n-helper extract
i18n-helper scan -e
# 提取指定文件中的中文词条
i18n-helper extract [path|filename]
i18n-helper scan -e [path|filename]

# 翻译 i18n.config.json 中配置翻译文件词条， -m 腾讯翻译君机器翻译
# 从翻译源文件文件中翻译
i18n-helper translate
i18n-helper scan -t
# 腾讯翻译君自动翻译
i18n-helper translate -m
i18n-helper scan -tm
# 翻译指定语言
# 从翻译源文件文件中翻译
i18n-helper translate [language]
# 腾讯翻译君自动翻译指定语言文件
i18n-helper translate -m [language]

# 统计 i18n.config.json 中翻译文件的翻译情况
i18n-helper count
i18n-helper scan -c
# 统计指定语言翻译文件的翻译情况，多个语言用,分隔
i18n-helper count [language]
```

## 配置说明

```javascript
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
```

## 其他

其实，就提取词条而已，也有不少成熟方案，比方说 [i18next-scanner](https://github.com/i18next/i18next-scanner)。我也不是闲得没事造轮子，主要是包裹词条这部分我们遇到了很大的问题（存量站点国际化，页面巨多。。。虽然不用我去包裹词条，提取词条，但看着有些同学。。。于心不忍），写的过程中发现提取可以一起，所以顺手弄了下，目前还在完善中，欢迎大家试用，大家有问题可以提 issue
