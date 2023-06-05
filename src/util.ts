export const coerceToNumber = (val: unknown, integer?: boolean): unknown => {
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

export const coerceType = (type: string, val: unknown): unknown => {
    switch (type) {
        case 'number':
        case 'integer':
            return coerceToNumber(val, type === 'integer');
        default:
            return val;
    }
};

export const ucFirst = (str: string): string => {
    return str[0].toUpperCase() + str.slice(1);
};
