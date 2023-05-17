import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

import { isTypeboxDto } from './util.js';

@Injectable()
export class TypeboxValidationPipe implements PipeTransform {
    public transform(value: unknown, metadata: ArgumentMetadata) {
        const { metatype } = metadata;

        if (!isTypeboxDto(metatype)) {
            return value;
        }

        return metatype.validate(value);
    }
}
