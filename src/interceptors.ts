import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { isTypeboxDto } from './util.js';

@Injectable()
export class TypeboxTransformInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(
            map(data => {
                const responseMeta = this.reflector.get(DECORATORS.API_RESPONSE, context.getHandler());
                const dto = (responseMeta['200'] || responseMeta['201'] || {})['type'];

                if (!isTypeboxDto(dto)) return data;

                if (Array.isArray(data)) {
                    return data.map(datum => dto.validate(datum));
                }

                return dto.validate(data);
            })
        );
    }
}
