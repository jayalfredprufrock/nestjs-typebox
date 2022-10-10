import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { TypeboxModel } from './create-dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TypeboxTransformInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(
            map(data => {
                const responseMeta = this.reflector.get(DECORATORS.API_RESPONSE, context.getHandler());
                const responseType = (responseMeta['200'] || responseMeta['201'] || {})['type'];

                if (!responseType) return data;

                const dataArray = Array.isArray(data) ? data : [data];

                return dataArray.map((dataOrModel: unknown) => {
                    const data = dataOrModel instanceof TypeboxModel ? dataOrModel.data : dataOrModel;
                    return responseType.validate ? responseType.validate(data) : data;
                });
            })
        );
    }
}
