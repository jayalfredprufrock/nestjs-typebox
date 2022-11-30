import type { TypeboxDto } from './create-dto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
export function isTypeboxDto(metatype: any): metatype is TypeboxDto<{}> {
    return typeof metatype === 'function' && metatype?.isTypeboxDto;
}

export const tryCoerceToNumber = (val: unknown, integer?: boolean): unknown => {
    switch (typeof val) {
        case 'number':
            return integer ? Math.floor(val) : val;
        case 'boolean':
            return val === true ? 1 : 0;
        case 'string': {
            const v = Number(val);
            if (Number.isFinite(v)) {
                return integer ? Math.floor(v) : v;
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
