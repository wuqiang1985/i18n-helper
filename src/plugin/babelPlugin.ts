import type * as tt from '@babel/types';
import type { NodePath } from '@babel/traverse';

import { isChinese } from '../util/helper';
import { iTransInfo, iI18nConf, iWordInfo } from '../types';

const i18nPlugin = (transInfo: iTransInfo, i18nConf: iI18nConf): any => {
  const JSX_WRAPPER = 'trans';
  const T_WRAPPER = i18nConf.wrapperFuncName;

  const plugin = ({ types: t }: { types: any }) => {
    // const wordInfoArray = [];
    const combine = (value: string) =>
      Object.assign(t.StringLiteral(value), {
        extra: {
          raw: `\'${value}\'`,
          rawValue: value,
        },
      });
    const replaceLineBreak = function (value: any) {
      if (typeof value !== 'string') return value;
      return value.replace(/\n/g, ' ').trim();
    };

    const collectWordingInfo = (
      value: string,
      path: NodePath<tt.Node>,
      thisArg: any,
      list: iWordInfo[],
    ) => {
      const filename =
        thisArg.filename || thisArg.file.opts.filename || 'unknown';
      const line = path.node.loc?.start?.line ?? 0;

      const wordInfo: iWordInfo = {
        key: value,
        filename,
        line,
      };

      // wordInfo 结构
      // [
      //   { key: '武强', fileName: 'index.js', line: '91' },
      //   { key: '你好呀', fileName: 'index.js', line: '191' },
      //   { key: '武强', fileName: 'index.ts', line: '291' },
      // ];
      list.push(wordInfo);
    };

    return {
      visitor: {
        StringLiteral(path: NodePath<tt.StringLiteral>) {
          const { value } = path.node;
          if (isChinese(value)) {
            let newNode = t.CallExpression(t.Identifier(T_WRAPPER), [
              combine(value),
            ]);

            if (path.parentPath?.node.type === 'JSXAttribute') {
              newNode = t.JSXExpressionContainer(newNode);
            }
            path.replaceWith(newNode);

            transInfo.needT = true;
            collectWordingInfo(
              value,
              path as NodePath,
              this,
              transInfo.wordInfoArray,
            );
          }
        },

        TemplateLiteral(path: NodePath<tt.TemplateLiteral>) {
          // 全部不包含中文词条则不处理
          if (path.node.quasis.every((word) => !isChinese(word.value.raw))) {
            return;
          }

          type CustomArray = (tt.TemplateElement | tt.Expression | tt.TSType)[];
          const tempArr = (
            [].concat(
              path.node.quasis as [],
              path.node.expressions as [],
            ) as CustomArray
          ).sort((a, b) => {
            const aStart = a.start ?? 0;
            const bStart = b.start ?? 0;
            return aStart - bStart;
          });

          let v = '';
          const variable: any = {};

          // 组装模板字符串左侧部分
          tempArr.forEach((templateLiteralItem) => {
            switch (templateLiteralItem.type) {
              case 'TemplateElement':
                v += `${replaceLineBreak(templateLiteralItem.value.cooked)}`;
                break;
              case 'Identifier':
                // `我有{xx}`
                variable[templateLiteralItem.name] = t.name;
                v += `{{${templateLiteralItem.name}}}`;
                break;
              case 'CallExpression':
                // TODO:
                // `我有{obj.xx()}`
                // `我有{xx()}`
                break;
              case 'MemberExpression':
                // TODO:
                // `我有{obj.xx}`
                break;
              default:
                break;
            }
          });

          // 组装模板字符串右侧对象
          const objArray: any = [];
          Object.keys(variable).map((key) => {
            const obj = t.objectProperty(t.Identifier(key), t.Identifier(key));
            obj.shorthand = true;

            objArray.push(obj);
          });

          const newNode = t.CallExpression(t.Identifier(T_WRAPPER), [
            combine(v),
            t.ObjectExpression(objArray),
          ]);
          path.replaceWith(newNode);

          transInfo.needT = true;
          collectWordingInfo(
            v,
            path as NodePath,
            this,
            transInfo.wordInfoArray,
          );
        },

        JSXText(path: NodePath<tt.JSXText>) {
          const { node } = path;
          const { value } = node;

          // jsx内部文字包含中文且不被<trans></trans>包裹
          if (
            isChinese(value) &&
            (
              (path.parentPath.node as tt.JSXElement).openingElement
                .name as tt.JSXIdentifier
            ).name !== JSX_WRAPPER
          ) {
            let newNode;
            if (i18nConf.jsx2Trans) {
              // t.jsxElement(openingElement, closingElement, children, selfClosing);
              newNode = t.jsxElement(
                t.jsxOpeningElement(t.jsxIdentifier(JSX_WRAPPER), []),
                t.jsxClosingElement(t.jsxIdentifier(JSX_WRAPPER)),
                [t.jsxText(value)],
                true,
              );
            } else {
              newNode = t.CallExpression(t.Identifier(T_WRAPPER), [
                combine(replaceLineBreak(value)),
              ]);
              newNode = t.JSXExpressionContainer(newNode);
            }
            path.replaceWith(newNode);

            transInfo.needTrans = true;
            collectWordingInfo(
              replaceLineBreak(node.value.trim()),
              path as NodePath,
              this,
              transInfo.wordInfoArray,
            );
          }
        },

        CallExpression(path: NodePath<tt.CallExpression>) {
          // 跳过t()
          if (path.node.callee.type === 'Identifier') {
            if (path.node.callee.name === T_WRAPPER) {
              path.skip();
            }
          }
        },
        ImportDeclaration(path: NodePath<tt.ImportDeclaration>) {
          const { node } = path;
          if (node.source.value === 'react-i18next') {
            transInfo.needImport = false;
          }
        },
      },
    };
  };

  return plugin;
};

export default i18nPlugin;
