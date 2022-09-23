import type { TypeboxDto } from './create-dto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
export function isTypeboxDto(metatype: any): metatype is TypeboxDto<{}> {
    return typeof metatype === 'function' && metatype?.isTypeboxDto;
}

export const tryCoerceToNumber = (val: unknown): unknown => {
    switch (typeof val) {
        case 'number':
            return val;
        case 'boolean':
            return val === true ? 1 : 0;
        case 'string': {
            const v = Number(val);
            if (Number.isFinite(v)) {
                return v;
            }
            break;
        }
        case 'object': {
            if (val === null) return 0;
            break;
        }
    }
    return val;
};
