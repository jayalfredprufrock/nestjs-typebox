import { Static, Type, TSchema } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { tryCoerceToNumber } from './util';
import { TypeboxValidationException } from './exceptions';
import { Merge } from './types';

export interface TypeboxDto<T extends TSchema = TSchema> {
    new (): Merge<Static<T>>;
    isTypeboxDto: true;
    typeboxSchema: T;
    validator: TypeCheck<T> | undefined;
    toJsonSchema(): T;
    beforeValidate(data: Record<string, unknown>): unknown;
    validate(data: unknown): Static<T>;
}

export interface DtoOptions {
    coerceTypes?: boolean;
    stripUnknownProps?: boolean;
}

export const createTypeboxDto = <T extends TSchema>(schema: T, options?: DtoOptions) => {
    class AugmentedTypeboxDto {
        public static isTypeboxDto = true;
        public static schema = schema;
        public static options = options;
        public static validator: TypeCheck<T> | undefined;

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

        public static validate(data: unknown): Static<T> {
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

        constructor() {
            throw new Error('DTO classes are not meant to be instantiated.');
        }
    }

    return AugmentedTypeboxDto as unknown as TypeboxDto<T>;
};
