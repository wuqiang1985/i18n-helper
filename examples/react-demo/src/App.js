import { useTranslation } from 'react-i18next';
import logo from './logo.svg';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();

  const onLangChanged = function () {
    const lang = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(lang);
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>{t('好好学习')}</p>
        <a
          className="App-link"
          href="https://github.com/wuqiang1985/i18n-helper"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('学习 i18n-helper-cli')}
        </a>
        <p>
          <button onClick={onLangChanged}>{t('切换语言')}</button>
        </p>
      </header>
    </div>
  );
}

export default App;
