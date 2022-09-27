import { SchemaObjectFactory } from '@nestjs/swagger/dist/services/schema-object-factory';
import { isTypeboxDto } from './util';

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
        const name = defaultExplore(type, schemas, schemaRefsStack);

        if (isTypeboxDto(type)) {
            schemas[name] = type.toJsonSchema();
        }

        return name;
    };

    SchemaObjectFactory.prototype.exploreModelSchema = extendedExplore;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SchemaObjectFactory.prototype as any).__primatePatched = true;
}
