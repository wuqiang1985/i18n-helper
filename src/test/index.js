import {
  Trans,
  useTranslation,
  Translation,
  withTranslation,
} from 'react-i18next';

let a = t('武强');
let aa = '武强';
let b = ['数组', 'array'];
let c = 'world';
let d = '试一试';

call('你好');

function call(val) {
  let text = '世界';
  alert(val + text);
}

let spread = { x: '哈哈', y: '嘿嘿' };

let e = `hello${a}`;
let f = `你好${a}`;
let g = `${b}你好${a}`;

const count = 3;
let str = '我有' + count + '条消息';
let temlateStr = `我有${count}条消息`;

class cls {
  go() {
    return '你好';
  }
}

function jsx() {
  return (
    <ul>
      <li title="你好好">
        <trans>会议列表</trans>
      </li>
      <li>
        文档列表<sub>由腾讯文档提供技术支持</sub>
      </li>
    </ul>
  );
}
