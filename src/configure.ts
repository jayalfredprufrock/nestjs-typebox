import { DefaultErrorFunction, SetErrorFunction } from '@sinclair/typebox/errors';

import { setFormats } from './formats.js';
import { patchNestJsSwagger } from './swagger-patch.js';
import { Configure } from './types.js';

export const configureNestJsTypebox = (options?: Configure) => {
    SetErrorFunction(params => params.schema.errorMessage ?? DefaultErrorFunction(params));

    if (options?.patchSwagger) {
        patchNestJsSwagger();
    }

    if (options?.setFormats) {
        setFormats();
    }
};
