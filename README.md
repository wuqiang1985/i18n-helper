# i18n-helper-cli · ![NPM](https://img.shields.io/github/license/wuqiang1985/i18n-helper) ![npm](https://img.shields.io/npm/dy/i18n-helper) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## What is i18n-helper-cli

i18n-helper-cli 是一个 Web 国际化整体解决方案，包含自动`包裹词条`，`提取词条`， `翻译词条`，`词条翻译统计`，`节省人力预估统计`，`网页多语言显示异常检测`（Coming soon）等功能。可以大大减低开发，测试，翻译各个角色的人力成本，减少重复劳动，低级错误。
![i18n-helper-cli](https://user-images.githubusercontent.com/1751494/129152542-77d9ed28-5abd-4f98-8302-2c657d20019d.gif)

## Why do we need i18n-helper-cli

### Web 国际化流程

随着出海的业务越来越多，web 应用面临越来越多的国际化的工作。简单来说可以分为以下 5 个步骤

1. 【选型】多语言框架选型（这里不深究，不在此篇范围），我们选定 [i18next](https://react.i18next.com/)，18n-helper-cli 对多语言框架并不限制
2. 【开发 - 包裹词条】从上面这步骤，我们知道需要把词条包裹起来，比如 `t('你好')`
3. 【开发 - 提取词条】把上一步中包裹的词条 copy 到翻译文件中
4. 【翻译 - 翻译】翻译把词条翻译好，填入翻译文件
5. 【测试 - 测试页面】开发提交测试后，对多语言页面进行测试

### 问题

通过上面 5 步，可以完成站点国际化。大多数场景大家就是这么做的，但这里充斥着大量人工劳动，大量人工劳动意味着`重复低效`，`出错几率提高`。让我们从以下三个阶段分析下这些问题

- 【开发阶段】

  1. 人工操作包裹和提取词条耗时长，但对个人无任何成长。如果是【全新开发】的站点，大家还可以耐着性子`包裹词条`，`提取词条`，但如果是【存量修改】及对已有的站点做国际化，而且这里的页面几十上百，甚至更多，这里的`包裹词条`，`提取词条`的工作量会让人崩溃

  2. 遗漏包裹，提取词条
  3. 提取词条后，运行多语言界面无法看到效果，需要等到翻译返回

- 【翻译阶段】

  1. 翻译耗时长
  2. 遗漏翻译

- 【测试阶段】

  1. 多语言页面测试每个都要测，耗费大量时间
  2. 遗漏测试某个多语言页面

所以这里最大的问题是上面这些工作都需`人工`操作，问题清楚了，那接下来我们要做的就是把这些人工操作能够交给机器，实现自动化，`提高效率`，`降低出错几率`。

### 解决方案 & 原理

i18n-helper-cli 可以很好的解决上述问题。

- 【词条包裹】通过对代码进行编译，得到`AST`，找到符合条件（中文，或者其他语言，可配置）的 Node，根据配置创建新 Node，替换老的 Node
- 【词条提取】同上，也是`AST`, 找到的符合条件的词条以及原代码已经包裹的词条会被一起提取，根据配置写入文件
- 【词条翻译】
  1. 从源文件翻译：如果有一份翻译词库（这里有常见的翻译），我们提取出来的未翻译词条在这里有，我们就可以直接从这里翻译
  2. 机器翻译：未翻译词条调用云服务实现翻译（这里我们用的是腾讯云的翻译服务）
- 【网页多语言显示异常检测】提供一份页面 url 列表，用 Cypress 进行截图，调用腾讯云 OCR 服务提取图片文字，进行对比，假设我们有个叫`你好`的词条翻译成 en 为`Hello`，如果我们通过 OCR 得到的是`Hel`，那么我们可以认为这个页面有问题（Coming soon）
- 【统计】
  1. 翻译词条统计：根据当前语言下未翻译词条数 / 词条总数
  2. 减低人工耗时预估：根据包裹，提取，翻译词条数预估

## How to use i18n-helper-cli

[请参考 example](./examples/react-demo/README.md)

### 使用方法

#### 安装

```shell
# npm 安装
npm install i18n-helper-cli -D
# yarn 安装
yarn add i18n-helper-cli —dev
```

#### 快捷使用

1. 在项目根目录下生成 i18n.config.json 文件

```shell
# 交互式命令行
i18n-helper init
# 生成默认配置文件，具体参见【配置说明】
i18n-helper init -y
```

2. 包裹 & 提取 & 翻译 & 统计

```shell
# 包裹 & 提取 & 翻译 & 统计 i18n.config.json 中 srcPath 文件中的中文词条
i18n-helper scan -wetc
```

#### 命令详情

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

#### 配置详情

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

## Roadmap

- [ ] 网页多语言显示异常检测
- [ ] 丰富提取文件(po, csv, excel 等等)
- [ ] 增加 git 模式，针对当前改动的文件才转 AST 包裹，提取
- [ ] 词条提取 cleanMode，目前如果代码中没有这个词条了，提取后的文件依然会有
- [ ] cli 国际化，配合自动翻译，应该会很快

## Other

目前还在完善中，欢迎大家试用，大家有问题可以提 issue。
