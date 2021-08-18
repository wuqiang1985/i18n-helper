import i18n from './i18n.js';

// return this.translator && (_this$translator = this.translator).translate.apply(_this$translator, arguments);
// i18next如上，可以使用i18n.t，但不能直接用t，所以需要改掉translator的指向，不然会报错
let { t } = i18n;
t = t.bind(i18n);

const init = () => {
  const title = t('好好学习');
  const description = t('天天向上');
  console.log(title, description);
};

init();
