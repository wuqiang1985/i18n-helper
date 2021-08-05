export interface iTransInfo {
  needT: boolean;
  needTrans: boolean;
  needImport: boolean;
  wordInfoArray: [];
}

export interface iWordInfo {
  key: string;
  filename: string;
  line: number;
}

export interface iI18nConf {
  projectType: string;
  srcPath: string;
  fileExt: string;
  wrapperFuncName: string;
  jsx2Trans: boolean;
  importStr: string;
  exclude: string;
  localeDir: string;
  languages: string;
  transFileName: string;
  transFileExt: string;
  parsedExclude?: string[];
  parsedLanguages?: string[];
}

export interface iCmd {
  wrap: boolean;
  extract: boolean;
  translate: boolean;
  count: boolean;
}
