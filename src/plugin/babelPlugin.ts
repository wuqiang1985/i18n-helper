import type * as tt from '@babel/types';
import type { NodePath } from '@babel/traverse';

import { isChinese } from '../util/helper';
import { iTransInfo, iWordInfo } from '../types';

const JSX_WRAPPER = 'trans';
const T_WRAPPER = 't';

const i18nPlugin = (transInfo: iTransInfo): any => {
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
      return value.replace(/\n/g, ' ');
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
        [value]: '',
        // filename,
        // line,
      };

      list.push(wordInfo);
    };

    return {
      visitor: {
        /**
         * 包裹t
         * */
        StringLiteral(path: NodePath<tt.StringLiteral>) {
          const { value } = path.node;
          if (isChinese(value)) {
            let newNode = t.CallExpression(t.Identifier(T_WRAPPER), [
              combine(value),
            ]);

            if (path.parentPath?.node.type === 'JSXAttribute') {
              newNode = t.JSXExpressionContainer(newNode);
            }

            transInfo.needT = true;
            collectWordingInfo(
              value,
              path as NodePath,
              this,
              transInfo.wordInfoArray,
            );
            path.replaceWith(newNode);
          }
        },

        TemplateLiteral(path: NodePath<tt.TemplateLiteral>) {
          if (!path.node.quasis.every((word) => !isChinese(word.value.raw))) {
            path.skip();
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
          // console.dir(`sss:${tempArr}`);

          let isReplace = false;
          let v = '';
          const variable: any = {};

          tempArr.forEach((templateLiteralItem) => {
            if (templateLiteralItem.type === 'TemplateElement') {
              v += `${replaceLineBreak(templateLiteralItem.value.cooked)}`;
              if (isChinese(templateLiteralItem.value.raw)) {
                isReplace = true;
              }
            } else if (templateLiteralItem.type === 'Identifier') {
              variable[templateLiteralItem.name.toString()] = t.name;
              v += `{{${templateLiteralItem.name}}}`;
            } else if (templateLiteralItem.type === 'CallExpression') {
              // TODO:
              isReplace = false;
            } else {
              // TODO:
              isReplace = false;
            }
          });
          // console.log(`sss:${v}`);
          if (!isReplace) {
            path.skip();
          }
          if (v.trim() === '') {
            path.skip();
          }

          const objArray: any = [];
          Object.keys(variable).map((key) => {
            const obj = t.objectProperty(t.Identifier(key), t.Identifier(key));
            obj.shorthand = true;

            objArray.push(obj);
          });

          collectWordingInfo(
            v,
            path as NodePath,
            this,
            transInfo.wordInfoArray,
          );

          const newNode = t.CallExpression(t.Identifier(T_WRAPPER), [
            combine(v),
            t.ObjectExpression(objArray),
          ]);

          transInfo.needT = true;
          path.replaceWith(newNode);

          path.skip();
        },

        JSXText(path: NodePath<tt.JSXText>) {
          const { node } = path;

          if (
            isChinese(node.value) &&
            (
              (path.parentPath.node as tt.JSXElement).openingElement
                .name as tt.JSXIdentifier
            ).name !== JSX_WRAPPER
          ) {
            collectWordingInfo(
              replaceLineBreak(node.value.trim()),
              path as NodePath,
              this,
              transInfo.wordInfoArray,
            );
            // t.jsxElement(openingElement, closingElement, children, selfClosing);
            const newNode = t.jsxElement(
              t.jsxOpeningElement(t.jsxIdentifier(JSX_WRAPPER), []),
              t.jsxClosingElement(t.jsxIdentifier(JSX_WRAPPER)),
              [t.jsxText(node.value)],
              true,
            );
            transInfo.needTrans = true;
            path.replaceWith(newNode);
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
