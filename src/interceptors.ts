import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { TypeboxDto } from './create-dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TypeboxTransformInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(
            map(data => {
                const responseMeta = this.reflector.get(DECORATORS.API_RESPONSE, context.getHandler());
                const dto = (responseMeta['200'] || responseMeta['201'] || {})['type'] as TypeboxDto | undefined;

                if (!dto) return data;

                if (Array.isArray(data)) {
                    return data.map(datum => dto.validate(datum));
                }

                return dto.validate(data);
            })
        );
    }
}
