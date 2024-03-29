import { transformSync } from '@babel/core';

import i18nPlugin from '../src/plugin/babelPlugin';
import { parseI18nConf } from '../src/util/fileHelper';
import { iI18nConf } from '../src/types';
import TestSuites from './plugin.testcase.json';

let plugin: any;

beforeAll(() => {
  const transInfo = {
    needT: false,
    needTrans: false,
    needImport: true,
    wordInfoArray: [],
    wrapCount: 0,
    wrapSuccess: false,
  };

  const conf: iI18nConf = parseI18nConf() as iI18nConf;
  conf.parsedExcludeWrapperFuncNameRegex = /^console|indexOf|append/;

  plugin = i18nPlugin(transInfo, conf);
});

const transformCode = (code: string) => {
  const result = transformSync(code, {
    plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }], plugin],
    // compact: true,
    retainLines: true,
  });

  return result;
};

type TestInfo = {
  input: string;
  output: string;
};

// eslint-disable-next-line no-restricted-syntax
for (const [testSuiteTitle, testSuite] of Object.entries(TestSuites)) {
  // eslint-disable-next-line no-loop-func
  describe(testSuiteTitle, () => {
    // eslint-disable-next-line no-restricted-syntax
    for (const [testCaseTitle, testCase] of Object.entries(testSuite)) {
      const testInfo = testCase as unknown as TestInfo;

      // eslint-disable-next-line no-loop-func
      it(testCaseTitle, () => {
        const result = transformCode(testInfo.input);

        if (result) {
          const { code } = result;
          expect(code).toEqual(testInfo.output);
        }
      });
    }
  });
}
