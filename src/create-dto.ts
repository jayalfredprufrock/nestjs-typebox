import { Static, TObject, TUnion, Type, TSchema } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { tryCoerceToNumber } from './util';
import { TypeboxValidationException } from './exceptions';

export type DtoProperties = Record<string, TSchema>;
export type DtoSchema<T extends DtoProperties> = TObject<T> | TUnion<TObject<T>[]>;

export interface TypeboxDto<T extends DtoProperties = TObject> {
    new (): Static<DtoSchema<T>>;
    isTypeboxDto: true;
    typeboxSchema: DtoSchema<T>;
    validator: TypeCheck<DtoSchema<T>> | undefined;
    toJsonSchema(): DtoSchema<T>;
    beforeValidate(data: Record<string, unknown>): unknown;
    validate(data: unknown): Static<DtoSchema<T>>;
}

export interface DtoOptions {
    coerceTypes?: boolean;
    stripUnknownProps?: boolean;
}

export abstract class TypeboxModel<T extends DtoProperties> {
    abstract readonly data: T;
}

export const createTypeboxDto = <T extends DtoProperties>(schema: DtoSchema<T>, options?: DtoOptions) => {
    class AugmentedTypeboxDto extends TypeboxModel<Static<DtoSchema<T>>> {
        public static isTypeboxDto = true;
        public static schema = schema;
        public static options = options;
        public static validator: TypeCheck<DtoSchema<T>> | undefined;

        public static toJsonSchema() {
            return Type.Strict(this.schema);
        }

        public static beforeValidate(data: Record<string, unknown>): unknown {
            const result = this.options?.stripUnknownProps ? ({} as Record<string, unknown>) : data;
            if (this.options?.coerceTypes || this.options?.stripUnknownProps) {
                const schemaProps = this.schema.anyOf ?? [this.schema.properties];
                for (const props of schemaProps) {
                    for (const [prop, def] of Object.entries(props)) {
                        if (data[prop] === undefined) continue;
                        const type = def && typeof def === 'object' && 'type' in def ? String(def.type) : 'unknown';
                        switch (type) {
                            case 'number':
                            case 'integer':
                                result[prop] = tryCoerceToNumber(data[prop], type === 'integer');
                                break;
                            default:
                                result[prop] = data[prop];
                        }
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
