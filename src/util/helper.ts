const isChinese = (val: string): boolean => /[\u4e00-\u9fa5]/.test(val);
const formatJSON = (val: any): string => JSON.stringify(val, null, 2);

const formatSeconds = (seconds: number): string => {
  const day = 8 * 60 * 60;
  const hour = 60 * 60;
  const minute = 60;

  const dd = Math.floor(seconds / day);
  const hh = Math.floor((seconds % day) / hour);
  const mm = Math.floor((seconds % hour) / minute);
  const ss = seconds % minute;

  if (dd > 0) {
    return `${dd}天${hh}小时${mm}分钟${ss}秒`;
  }
  if (hh > 0) {
    return `${hh}小时${mm}分钟${ss}秒`;
  }
  if (mm > 0) {
    return `${mm}分钟${ss}秒`;
  }
  return `${ss}秒`;
};

export { isChinese, formatJSON };
