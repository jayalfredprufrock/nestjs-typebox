import { FormatRegistry } from '@sinclair/typebox';

const emailRegex = /.+\@.+\..+/;
export const emailFormat = (value: string) => emailRegex.test(value);

const uuidRegex = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const uuidFormat = (value: string) => uuidRegex.test(value);

const urlRegex =
    /^(?:https?|wss?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;
export const urlFormat = (value: string) => urlRegex.test(value);

const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;

const isLeapYear = (year: number): boolean => {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
};

export const dateFormat = (value: string): boolean => {
    const matches: string[] | null = DATE.exec(value);
    if (!matches) return false;
    const year: number = +matches[1]!;
    const month: number = +matches[2]!;
    const day: number = +matches[3]!;
    return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]!);
};

const timeRegex = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
export const timeFormat = (value: string, strictTimeZone?: boolean): boolean => {
    const matches: string[] | null = timeRegex.exec(value);
    if (!matches) return false;
    const hr: number = +matches[1]!;
    const min: number = +matches[2]!;
    const sec: number = +matches[3]!;
    const tz: string | undefined = matches[4];
    const tzSign: number = matches[5] === '-' ? -1 : 1;
    const tzH: number = +(matches[6] || 0);
    const tzM: number = +(matches[7] || 0);
    if (tzH > 23 || tzM > 59 || (strictTimeZone && !tz)) return false;
    if (hr <= 23 && min <= 59 && sec < 60) return true;
    const utcMin = min - tzM * tzSign;
    const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
    return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
};

const dateTimeSplitRegex = /t|\s/i;
export const dateTimeFormat = (value: string, strictTimeZone?: boolean): boolean => {
    const dateTime: string[] = value.split(dateTimeSplitRegex);
    return dateTime.length === 2 && dateFormat(dateTime[0]!) && timeFormat(dateTime[1]!, strictTimeZone);
};

export const setFormats = () => {
    FormatRegistry.Set('email', emailFormat);
    FormatRegistry.Set('uuid', uuidFormat);
    FormatRegistry.Set('url', urlFormat);
    FormatRegistry.Set('date', dateFormat);
    FormatRegistry.Set('time', timeFormat);
    FormatRegistry.Set('date-time', dateTimeFormat);
};
