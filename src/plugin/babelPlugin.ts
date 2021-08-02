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
          const variableList: any = [];

          // 组装模板字符串左侧部分
          tempArr.forEach((templateLiteralItem) => {
            const variable: any = {};
            switch (templateLiteralItem.type) {
              case 'TemplateElement':
                // 文字
                v += `${replaceLineBreak(templateLiteralItem.value.cooked)}`;
                break;
              case 'Identifier': {
                // `我有{xx}`
                const identifierName = templateLiteralItem.name;

                variable.type = 'Identifier';
                variable.key = identifierName;
                variable.value = templateLiteralItem;
                variableList.push(variable);

                v += `{{${identifierName}}}`;
                break;
              }
              case 'CallExpression': {
                // `我有{obj.xx()}`
                // `我有{xx()}`

                const { type } = templateLiteralItem.callee;
                let callExpressionName = '';
                if (type === 'Identifier') {
                  callExpressionName = (
                    templateLiteralItem.callee as tt.Identifier
                  ).name;
                } else if (type === 'MemberExpression') {
                  callExpressionName = (
                    (templateLiteralItem.callee as tt.MemberExpression)
                      .property as tt.Identifier
                  ).name;
                }

                variable.type = 'CallExpression';
                variable.key = callExpressionName;
                variable.value = templateLiteralItem;
                variableList.push(variable);

                v += `{{${callExpressionName}}}`;
                break;
              }
              case 'MemberExpression': {
                // `我有{obj.xx}`
                const memberExpressionName = (
                  templateLiteralItem.property as tt.Identifier
                ).name;

                variable.type = 'MemberExpression';
                variable.key = memberExpressionName;
                variable.value = templateLiteralItem;
                variableList.push(variable);

                v += `{{${memberExpressionName}}}`;
                break;
              }
              default:
                break;
            }
          });

          // 组装模板字符串右侧对象
          const objArray: any = [];
          variableList.map((item: any) => {
            let obj;
            switch (item.type) {
              case 'Identifier': {
                obj = t.objectProperty(
                  t.Identifier(item.key),
                  item.value as tt.Identifier,
                );
                obj.shorthand = true;
                break;
              }
              case 'CallExpression':
                obj = t.objectProperty(
                  t.Identifier(item.key),
                  item.value as tt.CallExpression,
                );
                break;
              case 'MemberExpression':
                obj = t.objectProperty(
                  t.Identifier(item.key),
                  item.value as tt.MemberExpression,
                );
                break;
              default:
                break;
            }
            objArray.push(obj);
          });

          let newNode;
          if (objArray.length > 0) {
            newNode = t.CallExpression(t.Identifier(T_WRAPPER), [
              combine(v),
              t.ObjectExpression(objArray),
            ]);
          } else {
            // 处理文字全用``包裹的，并没有${}的内容，如 const word = `你好`
            newNode = t.CallExpression(t.Identifier(T_WRAPPER), [combine(v)]);
          }
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
              // 用trans包裹
              newNode = t.jsxElement(
                t.jsxOpeningElement(t.jsxIdentifier(JSX_WRAPPER), []),
                t.jsxClosingElement(t.jsxIdentifier(JSX_WRAPPER)),
                [t.jsxText(value)],
                true,
              );
            } else {
              // 用 t 包裹
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
          // 跳过 t 函数，但包裹的词条要提取出来，否则这里的词条修改后无法识别
          const { type, name } = path.node.callee as tt.Identifier;
          if (type === 'Identifier' && name === T_WRAPPER) {
            path.node.arguments
              .filter((arg) => arg.type === 'StringLiteral')
              .map((sl) => {
                const node = sl as tt.StringLiteral;
                collectWordingInfo(
                  node.value.trim(),
                  path as NodePath,
                  this,
                  transInfo.wordInfoArray,
                );
              });
            path.skip();
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
