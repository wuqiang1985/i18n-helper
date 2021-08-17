export interface iWordInfo {
  key: string;
  filename: string;
  line: number;
}
export interface iTransInfo {
  needT: boolean;
  needTrans: boolean;
  needImport: boolean;
  wordInfoArray: iWordInfo[];
  wrapCount: number;
}
export interface iI18nConf {
  projectType: string;
  srcPath: string;
  fileExt: string;
  wrapperFuncName: string;
  excludeWrapperFuncName: string;
  jsx2Trans: boolean;
  importStr: string;
  exclude: string;
  localeDir: string;
  languages: string;
  sourceLanguage: string;
  transFileName: string;
  transFileExt: string;
  targetTransDir: string;
  targetTransFile: string;
  secretId: string;
  secretKey: string;
  parsedExclude?: string[];
  parsedLanguages?: string[];
  parsedPath?: string;
  parsedImportKey: string;
  parsedExcludeWrapperFuncName: string[];
}

export interface iCmd {
  wrap: boolean;
  extract: boolean;
  translateSource: boolean;
  translateMachine: boolean;
  count: boolean;
}

export interface iTranType {
  machine: boolean;
}

// eslint-disable-next-line no-shadow
export enum TransType {
  SourceFile,
  TMT,
}

export interface iTransObj {
  [key: string]: string;
}

export interface iWrapResult {
  originalScanWordInfoLit?: iWordInfo[][];
  wrapInfo: Record<string, number>;
}
export interface iExtractResult {
  [key: string]: number;
}

export interface iActionResult {
  [key: string]: number;
}
