import type * as tt from '@babel/types';
import type { NodePath } from '@babel/traverse';

import Logger from '../util/logger';
import { needWrap } from '../util/helper';
import { iTransInfo, iI18nConf, iWordInfo } from '../types';

type TLQuasisExpressions = (tt.TemplateElement | tt.Expression | tt.TSType)[];

const i18nPlugin = (transInfo: iTransInfo, i18nConf: iI18nConf): any => {
  const JSX_WRAPPER = 'trans';
  const OPERATORS = ['===', '==', '!==', '!='];
  const { wrapCharacter, wrapperFuncName: T_WRAPPER } = i18nConf;

  /**
   * 获取 MemberExpression 完整名字
   * @param ME MemberExpression
   * @param names Array
   */
  const getName = (ME: tt.MemberExpression, names: string[]) => {
    let { property } = ME;
    const { object } = ME;
    property = property as tt.Identifier;
    names.push(property.name);
    if (object.type === 'MemberExpression') {
      getName(object, names);
    } else if (object.type === 'Identifier') {
      names.push((object as tt.Identifier).name);
    }
  };
  const plugin = ({ types: t }: { types: any }) => {
    const combine = (value: string) =>
      Object.assign(t.StringLiteral(value), {
        extra: {
          raw: `\'${value.replace("'", "\\'")}\'`,
          rawValue: value,
        },
      });

    const replaceLineBreak = (value: string) => {
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
          let { value } = path.node;
          value = replaceLineBreak(value);
          if (needWrap(wrapCharacter, value)) {
            // console.log(`string直接用 replaceLineBreak value：${value}`);
            let newNode = t.CallExpression(t.Identifier(T_WRAPPER), [
              combine(value),
            ]);

            if (path.parentPath?.node.type === 'JSXAttribute') {
              newNode = t.JSXExpressionContainer(newNode);
            }
            path.replaceWith(newNode);

            transInfo.needT = true;
            transInfo.wrapCount += 1;
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
          if (
            path.node.quasis.every(
              (word) => !needWrap(wrapCharacter, word.value.raw),
            )
          ) {
            return;
          }

          const quasisExpressionsList = (
            [].concat(
              path.node.quasis as [],
              path.node.expressions as [],
            ) as TLQuasisExpressions
          ).sort((a, b) => {
            const aStart = a.start ?? 0;
            const bStart = b.start ?? 0;
            return aStart - bStart;
          });

          let value = '';
          let CEIndex = 0;
          let BEIndex = 0;
          let LEIndex = 0;
          let OMEIndex = 0;
          let OCEIndex = 0;
          const variableList: any = [];

          // 组装模板字符串左侧部分
          quasisExpressionsList.forEach((templateLiteralItem) => {
            const variable: any = {};
            switch (templateLiteralItem.type) {
              case 'TemplateElement':
                // 文字
                value += `${replaceLineBreak(
                  templateLiteralItem.value.cooked ?? '',
                )}`;
                break;
              case 'Identifier': {
                // `我有{xx}`
                const identifierName = templateLiteralItem.name;

                variable.type = 'Identifier';
                variable.key = identifierName;
                variable.value = templateLiteralItem;
                variableList.push(variable);

                value += `{{${identifierName}}}`;
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

                value += `{{${callExpressionName}}}`;
                break;
              }
              case 'MemberExpression': {
                let memberExpressionName;
                // `我有${obj.xx},${obj[xx]}` Identifier
                // `我有${obj['xx']}` StringLiteral
                // `我有${array[0]}` NumericLiteral
                switch (templateLiteralItem.property.type) {
                  case 'Identifier':
                    memberExpressionName = (
                      templateLiteralItem.property as tt.Identifier
                    ).name;
                    break;
                  case 'StringLiteral':
                    memberExpressionName = (
                      templateLiteralItem.property as tt.StringLiteral
                    ).value;
                    break;
                  case 'NumericLiteral':
                    memberExpressionName = (
                      templateLiteralItem.property as tt.NumericLiteral
                    ).value.toString();
                    break;
                  case 'MemberExpression':
                    memberExpressionName = (
                      templateLiteralItem.property.property as tt.Identifier
                    ).name;
                    break;
                  case 'BinaryExpression':
                    // TODO: 需要看看怎么改
                    memberExpressionName = 'BinaryExpression';
                    break;
                  default:
                    break;
                }

                variable.type = 'MemberExpression';
                variable.key = memberExpressionName;
                variable.value = templateLiteralItem;
                variableList.push(variable);

                value += `{{${memberExpressionName}}}`;
                break;
              }
              case 'ConditionalExpression': {
                // TODO: 目前用ConditionalExpression{index}作为key，可读性不是太好
                // 另外如果`武强${index > '这' ? '哈哈' : '呵呵'}呢`
                // 如上'这'，’哈哈‘，’呵呵‘都不会被包裹。。。
                CEIndex += 1;
                variable.type = 'ConditionalExpression';
                variable.key = `ConditionalExpression${CEIndex}`;
                variable.value = templateLiteralItem;
                variableList.push(variable);

                value += `{{${variable.key}}}`;
                break;
              }
              case 'BinaryExpression': {
                BEIndex += 1;
                variable.type = 'BinaryExpression';
                variable.key = `BinaryExpression${BEIndex}`;
                variable.value = templateLiteralItem;
                variableList.push(variable);

                value += `{{${variable.key}}}`;
                break;
              }
              case 'LogicalExpression': {
                LEIndex += 1;
                variable.type = 'LogicalExpression';
                variable.key = `LogicalExpression${LEIndex}`;
                variable.value = templateLiteralItem;
                variableList.push(variable);

                value += `{{${variable.key}}}`;
                break;
              }
              case 'OptionalMemberExpression': {
                OMEIndex += 1;
                variable.type = 'OptionalMemberExpression';
                variable.key = `OptionalMemberExpression${OMEIndex}`;
                variable.value = templateLiteralItem;
                variableList.push(variable);

                value += `{{${variable.key}}}`;
                break;
              }
              case 'OptionalCallExpression': {
                OCEIndex += 1;
                variable.type = 'OptionalCallExpression';
                variable.key = `OptionalCallExpression${OCEIndex}`;
                variable.value = templateLiteralItem;
                variableList.push(variable);

                value += `{{${variable.key}}}`;
                break;
              }
              default: {
                const thisArgs = this as any;
                const filename =
                  thisArgs.filename || thisArgs.file.opts.filename || 'unknown';
                const line = path.node.loc?.start?.line ?? 0;
                Logger.appendFile(
                  `[${filename}][${line}]: ${templateLiteralItem.type} 未处理`,
                );
                transInfo.wrapSuccess = false;
                break;
              }
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
              case 'ConditionalExpression':
                obj = t.objectProperty(
                  t.Identifier(item.key),
                  item.value as tt.ConditionalExpression,
                );
                break;
              case 'BinaryExpression':
                obj = t.objectProperty(
                  t.Identifier(item.key),
                  item.value as tt.BinaryExpression,
                );
                break;
              case 'LogicalExpression':
                obj = t.objectProperty(
                  t.Identifier(item.key),
                  item.value as tt.LogicalExpression,
                );
                break;
              case 'OptionalMemberExpression':
                obj = t.objectProperty(
                  t.Identifier(item.key),
                  item.value as tt.OptionalMemberExpression,
                );
                break;
              case 'OptionalCallExpression':
                obj = t.objectProperty(
                  t.Identifier(item.key),
                  item.value as tt.OptionalCallExpression,
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
              combine(value),
              t.ObjectExpression(objArray),
            ]);
          } else {
            // 处理文字全用``包裹的，并没有${}的内容，如 const word = `你好`
            newNode = t.CallExpression(t.Identifier(T_WRAPPER), [
              combine(value),
            ]);
          }
          path.replaceWith(newNode);

          transInfo.needT = true;
          transInfo.wrapCount += 1;
          collectWordingInfo(
            value,
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
            needWrap(wrapCharacter, value)
            // needWrap(value) &&
            // (
            //   (path.parentPath.node as tt.JSXElement).openingElement
            //     .name as tt.JSXIdentifier
            // ).name !== JSX_WRAPPER
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
              // console.log(`jsx直接用value：${value}`);
              newNode = t.CallExpression(t.Identifier(T_WRAPPER), [
                combine(replaceLineBreak(value)),
              ]);
              newNode = t.JSXExpressionContainer(newNode);
            }
            path.replaceWith(newNode);

            transInfo.needTrans = true;
            transInfo.wrapCount += 1;
            collectWordingInfo(
              replaceLineBreak(node.value.trim()),
              path as NodePath,
              this,
              transInfo.wordInfoArray,
            );
          }
        },

        CallExpression(path: NodePath<tt.CallExpression>) {
          const excludeFuncNameRegex =
            i18nConf.parsedExcludeWrapperFuncNameRegex;
          switch (path.node.callee.type) {
            // TODO: 这里目前只能处理 Identifier 方法，后续需要修改
            case 'Identifier': {
              const { name } = path.node.callee as tt.Identifier;

              // 如果是 i18n 包裹的则只收集词条
              if (name === T_WRAPPER) {
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

              // 处理排除方法 excludeWrapperFuncName
              if (excludeFuncNameRegex.test(name)) {
                path.skip();
              }
              break;
            }
            case 'MemberExpression': {
              // 处理排除方法 excludeWrapperFuncName
              const names: string[] = [];
              const me = path.node.callee as tt.MemberExpression;
              getName(me, names);
              const MEName = names.reverse().join('.');
              if (excludeFuncNameRegex.test(MEName)) {
                path.skip();
              }

              break;
            }
            default:
              break;
          }
        },

        BinaryExpression(path: NodePath<tt.BinaryExpression>) {
          if (OPERATORS.includes(path.node.operator)) {
            path.skip();
          }
        },

        ImportDeclaration(path: NodePath<tt.ImportDeclaration>) {
          if (path.node.source.extra?.raw === i18nConf.parsedImportKey) {
            transInfo.needImport = false;
          }
        },
      },
    };
  };

  return plugin;
};

export default i18nPlugin;
