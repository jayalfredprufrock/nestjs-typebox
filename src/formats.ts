import { FormatRegistry } from '@sinclair/typebox';

const emailRegex = /.+\@.+\..+/;
export const emailFormat = (value: string) => value.match(emailRegex) !== null;

export const applyFormats = () => {
    FormatRegistry.Set('email', emailFormat);
};
