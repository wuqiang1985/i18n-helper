const I18N_CONFIGURATION_FILE_NAME = 'i18n.config.json';
const I18N_LOG_FILE_NAME = 'i18n.log';
const I18N_ERROR_LOG_FILE_NAME = 'i18n.error.log';

const ACTION_STATISTICS: Record<string, any> = {
  wrap: { time: 3, title: '包裹' },
  extract: { time: 5, title: '提取' },
  translate: { time: 20, title: '翻译' },
};

export {
  I18N_CONFIGURATION_FILE_NAME,
  ACTION_STATISTICS,
  I18N_LOG_FILE_NAME,
  I18N_ERROR_LOG_FILE_NAME,
};
