import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { isTypeboxDto } from './util';

@Injectable()
export class TypeboxValidationPipe implements PipeTransform {
    public transform(value: unknown, metadata: ArgumentMetadata) {
        const { metatype } = metadata;

        if (!isTypeboxDto(metatype)) {
            return value;
        }

        metatype.validate(metatype.beforeValidate(value));

        return value;
    }
}
