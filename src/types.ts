export interface iTransInfo {
  needT: boolean;
  needTrans: boolean;
  needImport: boolean;
  wordInfoArray: [];
}

export interface iWordInfo {
  key?: string;
  filename?: string;
  line?: number;
}
