import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ValueError } from '@sinclair/typebox/errors';

export class TypeboxValidationException extends BadRequestException {
    constructor(errors: IterableIterator<ValueError>) {
        super({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: [...errors],
        });
    }
}
