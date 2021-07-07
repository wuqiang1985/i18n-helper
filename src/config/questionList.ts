const questions = [
  {
    type: 'checkbox',
    name: 'projectType',
    message: '请选择项目类型',
    default: 0,
    choices: [
      { name: 'js', value: 'js' },
      { name: 'react', value: 'react' },
      { name: 'vue', value: 'vue', disabled: true },
    ],
  },
  {
    name: 'srcPath',
    message: '请输入源码路径',
    default: './',
  },
  {
    name: 'localePath',
    message: '请输入文件类型',
    default: './locales',
  },
  {
    name: 'wrapperFuncName',
    message: '请输入包裹方法',
    default: 't',
  },
  {
    name: 'excludePath',
    message: '请输入忽略路径',
    default: 'node_modules',
  },
];

export default questions;
