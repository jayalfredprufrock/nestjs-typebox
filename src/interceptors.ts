import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { TypeboxDto, TypeboxModel } from './create-dto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TObject } from '@sinclair/typebox';

const validateDataOrModel = (dataOrModel: unknown, dto?: TypeboxDto<TObject>) => {
    const data = dataOrModel instanceof TypeboxModel ? dataOrModel.data : dataOrModel;
    return dto?.validate ? dto.validate(data) : data;
};

@Injectable()
export class TypeboxTransformInterceptor implements NestInterceptor {
    constructor(private reflector: Reflector) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next.handle().pipe(
            map(data => {
                const responseMeta = this.reflector.get(DECORATORS.API_RESPONSE, context.getHandler());
                const dto = (responseMeta['200'] || responseMeta['201'] || {})['type'];

                if (!dto) return data;

                if (Array.isArray(data)) {
                    return data.map(dataOrModel => validateDataOrModel(dataOrModel, dto));
                }

                return validateDataOrModel(data, dto);
            })
        );
    }
}
