import { Format } from '@sinclair/typebox/format';

const emailRegex = /.+\@.+\..+/;
export const emailFormat = (value: string) => value.match(emailRegex) !== null;

export const applyFormats = () => {
    Format.Set('email', emailFormat);
};
