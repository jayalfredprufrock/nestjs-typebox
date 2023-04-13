import { BadRequestException, HttpStatus } from '@nestjs/common';
import { ValueErrorIterator, ValueError, ValueErrorType } from '@sinclair/typebox/errors';

export class TypeboxValidationException extends BadRequestException {
    constructor(errors: ValueErrorIterator) {
        const topLevelErrors: ValueError[] = [];
        const unionPaths: string[] = [];
        for (const error of errors) {
            // don't deeply traverse union errors to reduce error noise
            if (unionPaths.some(path => error.path.includes(path))) continue;
            if (error.type === ValueErrorType.Union) {
                unionPaths.push(error.path);
            }
            topLevelErrors.push(error);
        }

        super({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Validation failed',
            errors: topLevelErrors,
        });
    }
}
