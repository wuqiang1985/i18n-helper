# React Demo

我们来通过一个 react 项目国际化来学习 i18n-helper-cli

## 准备步骤

1. CRA 创建 react 项目

```shell
npx create-react-app my-app
```

2. 安装 i18n 相关依赖

```shell
npm i i18next i18next-http-backend react-i18next
```

3. 安装 i18n-helper-cli 工具

```shell
npm i i18n-helper-cli -D
```

4. 根据需要生成 i18n 并修改配置文件

```shell
   npx i18n-helper-cli init -y
```

5. 在 package.json 里添加 i18n 相关命令

```javascript
   翻译源文件形式
   "i18n": "i18n-helper scan -wetc"
   机器翻译形式
   "i18nMachine": "i18n-helper scan -we -tm -c"
```

6. 代码开发

- 把./src/App.js 写上我们所需要的中文词条, 切换语言代码

```javascript
const { t, i18n } = useTranslation();
const onLangChanged = function () {
  const lang = i18n.language === 'cn' ? 'en' : 'cn';
  i18n.changeLanguage(lang);
};
```

- 在 src 中添加 i18n.js

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import Backend from 'i18next-http-backend';
// import LanguageDetector from 'i18next-browser-languagedetector';
// don't want to use this?
// have a look at the Quick start guide
// for passing in lng and translations on init

console.log(window.location.search);

const currentLanguage = window.location.search.split('=')[1];
console.log('currentLanguage:' + currentLanguage);

i18n
  // load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
  // learn more: https://github.com/i18next/i18next-http-backend
  // want your translations to be loaded from a professional CDN? => https://github.com/locize/react-tutorial#step-2---use-the-locize-cdn
  .use(Backend)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  //   .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    lng: currentLanguage,
    fallbackLng: 'en',
    debug: false,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  });

export default i18n;
```

- 在 ./src/index.js 导入 i18n 和 Suspense

```javascript
import './i18n';
import React, { Suspense } from 'react';

<Suspense fallback="loading">
  <App />
</Suspense>;
```

## 运行体验

- 包裹，提取，翻译词条

```shell
# t，从翻译源文件翻译
# 如果没有翻译文件去掉t,=> i18n-helper scan -wec，
# 如果有，自己根据配置文件中targetTransDir，targetTransFile创建文件，语言对应提取词条的语言
#  e.g. ./src/translations/transLib.json
npm run i18n

# -tm 机器翻译
# 需要自己填入腾讯云的secretId & secretKey
npm run i18nMachine
```

- 如果没有翻译，请把词条自己随意翻译下

- 运行站点

```shell
npm start
```

## 运行本例子

为了节省大家时间，我这里都已经配置好了，所以要跑起来

1. ./i18n.config_react.json -> ./i18n.config.json
2. npm install

3. npm run i18n
4. 填写提取的翻译文件中
5. npm start
