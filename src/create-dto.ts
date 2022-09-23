import { Static, TObject, TProperties, Type } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { tryCoerceToNumber } from './util';
import { TypeboxValidationException } from './exceptions';

export interface TypeboxDto<T extends TProperties, R = Static<TObject<T>>> {
    new (): R;
    isTypeboxDto: true;
    typeboxSchema: TObject<T>;
    validator: TypeCheck<TObject<T>> | undefined;
    toJsonSchema(): TObject<T>;
    beforeValidate(data: unknown): unknown;
    validate(data: unknown): unknown;
    transform(data: Static<TObject<T>>): R;
}

export interface DtoOptions<T extends TProperties, R = Static<TObject<T>>> {
    transform?: (data: Static<TObject<T>>) => R;
    coerceTypes?: boolean;
    stripUnknownProps?: boolean;
}

export abstract class TypeboxModel<T extends TProperties> {
    abstract readonly data: T;
}

export const createTypeboxDto = <T extends TProperties, R = Static<TObject<T>>>(schema: TObject<T>, options?: DtoOptions<T, R>) => {
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
                const schema = this.toJsonSchema();
                for (const [prop, def] of Object.entries(schema.properties)) {
                    if (data[prop] === undefined) continue;
                    switch (def.type) {
                        case 'number':
                            result[prop] = tryCoerceToNumber(data[prop]);
                            break;
                        default:
                            result[prop] = data[prop];
                    }
                }
            }
            return result;
        }

        public static validate(data: unknown): void {
            if (!this.validator) {
                this.validator = TypeCompiler.Compile(this.schema);
            }

            if (!this.validator.Check(data)) {
                throw new TypeboxValidationException(this.validator.Errors(data));
            }
        }

        public static transform(data: Static<TObject<T>>): R {
            return this.options?.transform?.(data) ?? (data as unknown as R);
        }

        constructor(readonly data: Static<TObject<T>>) {
            super();
        }
    }

    return AugmentedTypeboxDto as unknown as TypeboxDto<T, R>;
};
