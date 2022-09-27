import { Type as NestType } from '@nestjs/common';
import { SchemaObjectFactory as SchemaObjectFactoryClass } from '@nestjs/swagger/dist/services/schema-object-factory';
import { isTypeboxDto } from './util';

function getSchemaObjectFactory(): NestType<SchemaObjectFactoryClass> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@nestjs/swagger/dist/services/schema-object-factory').SchemaObjectFactory;
}

export function patchNestJsSwagger(SchemaObjectFactory = getSchemaObjectFactory()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((SchemaObjectFactory.prototype as any).__primatePatched) return;
    const defaultExplore = SchemaObjectFactory.prototype.exploreModelSchema;

    const extendedExplore: SchemaObjectFactoryClass['exploreModelSchema'] = function exploreModelSchema(
        this: SchemaObjectFactoryClass,
        type,
        schemas,
        schemaRefsStack
    ) {
        if (this['isLazyTypeFunc'](type)) {
            const factory = type as () => NestType<unknown>;
            type = factory();
        }

        if (!isTypeboxDto(type)) {
            return defaultExplore(type, schemas, schemaRefsStack);
        }

        schemas[type.name] = type.toJsonSchema();

        return type.name;
    };

    SchemaObjectFactory.prototype.exploreModelSchema = extendedExplore;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SchemaObjectFactory.prototype as any).__primatePatched = true;
}
