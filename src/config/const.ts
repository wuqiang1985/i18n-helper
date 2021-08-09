const I18N_CONFIGURATION_FILE_NAME = 'i18n.config.json';
const FILE_TYPE = 'js,jsx,ts,tsx';

const T_WRAPPER = 't';
const JSX_WRAPPER = 'trans';

const ACTION_STATISTICS: Record<string, any> = {
  wrap: { time: 3, title: '包裹' },
  extract: { time: 5, title: '提取' },
  translate: { time: 20, title: '翻译' },
};

export {
  I18N_CONFIGURATION_FILE_NAME,
  FILE_TYPE,
  T_WRAPPER,
  JSX_WRAPPER,
  ACTION_STATISTICS,
};
