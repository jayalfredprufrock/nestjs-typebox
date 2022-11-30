import { Static, TObject, TProperties, Type } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { tryCoerceToNumber } from './util';
import { TypeboxValidationException } from './exceptions';

export interface TypeboxDto<T extends TProperties> {
    new (): Static<TObject<T>>;
    isTypeboxDto: true;
    typeboxSchema: TObject<T>;
    validator: TypeCheck<TObject<T>> | undefined;
    toJsonSchema(): TObject<T>;
    beforeValidate(data: Record<string, unknown>): unknown;
    validate(data: unknown): Static<TObject<T>>;
}

export interface DtoOptions {
    coerceTypes?: boolean;
    stripUnknownProps?: boolean;
}

export abstract class TypeboxModel<T extends TProperties> {
    abstract readonly data: T;
}

export const createTypeboxDto = <T extends TProperties>(schema: TObject<T>, options?: DtoOptions) => {
    class AugmentedTypeboxDto extends TypeboxModel<Static<TObject<T>>> {
        public static isTypeboxDto = true;
        public static schema = schema;
        public static options = options;
        public static validator: TypeCheck<TObject<T>> | undefined;

        public static toJsonSchema() {
            return Type.Strict(this.schema);
        }

        public static beforeValidate(data: Record<string, unknown>): unknown {
            const result = this.options?.stripUnknownProps ? ({} as Record<string, unknown>) : data;
            if (this.options?.coerceTypes || this.options?.stripUnknownProps) {
                for (const [prop, def] of Object.entries(this.schema.properties)) {
                    if (data[prop] === undefined) continue;
                    switch (def.type) {
                        case 'number':
                        case 'integer':
                            result[prop] = tryCoerceToNumber(data[prop], def.type === 'integer');
                            break;
                        default:
                            result[prop] = data[prop];
                    }
                }
            }
            return result;
        }

        public static validate(data: unknown): Static<TObject<T>> {
            if (!this.validator) {
                this.validator = TypeCompiler.Compile(this.schema);
            }

            if (!data || typeof data !== 'object') {
                throw new Error('DTOs are expected to always be objects.');
            }

            const processedData = this.beforeValidate(data as Record<string, unknown>);

            if (!this.validator.Check(processedData)) {
                throw new TypeboxValidationException(this.validator.Errors(processedData));
            }

            return processedData;
        }

        constructor(readonly data: Static<TObject<T>>) {
            super();
        }
    }

    return AugmentedTypeboxDto as unknown as TypeboxDto<T>;
};
