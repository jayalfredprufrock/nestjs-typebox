import { Type as NestType } from '@nestjs/common';
import { SchemaObjectFactory } from '@nestjs/swagger/dist/services/schema-object-factory.js';

import { isSchemaValidator } from './decorators.js';

export function patchNestJsSwagger() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((SchemaObjectFactory.prototype as any).__primatePatched) return;
    const defaultExplore = SchemaObjectFactory.prototype.exploreModelSchema;

    const extendedExplore: SchemaObjectFactory['exploreModelSchema'] = function exploreModelSchema(
        this: SchemaObjectFactory,
        type,
        schemas,
        schemaRefsStack
    ) {
        if (this['isLazyTypeFunc'](type)) {
            const factory = type as () => NestType<unknown>;
            type = factory();
        }

        if (!isSchemaValidator(type)) {
            return defaultExplore.apply(this, [type, schemas, schemaRefsStack]);
        }

        schemas[type.name] = type.schema;

        return type.name;
    };

    SchemaObjectFactory.prototype.exploreModelSchema = extendedExplore;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SchemaObjectFactory.prototype as any).__primatePatched = true;
}
