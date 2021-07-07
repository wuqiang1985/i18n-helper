const isChinese = (val: string): boolean => /[\u4e00-\u9fa5]/.test(val);
const formatJSON = (val: any): string => JSON.stringify(val, null, 2);

export { isChinese, formatJSON };
