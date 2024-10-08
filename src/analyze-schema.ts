import type { TArray, TIntersect, TObject, TRecord, TRef, TSchema, TTuple, TUnion } from '@sinclair/typebox';
import { Deref, Kind, TypeGuard } from '@sinclair/typebox';

function FromArray(schema: TArray, analysis: SchemaAnalysis): void {
    Visit(schema.items, analysis);
}

function FromIntersect(schema: TIntersect, analysis: SchemaAnalysis) {
    analysis.hasTransform = analysis.hasTransform || TypeGuard.IsTransform(schema.unevaluatedProperties);
    schema.allOf.forEach(schema => Visit(schema, analysis));
}

function FromObject(schema: TObject, analysis: SchemaAnalysis) {
    Object.values(schema.properties).forEach(schema => Visit(schema, analysis));
    if (TypeGuard.IsSchema(schema.additionalProperties)) {
        Visit(schema.additionalProperties, analysis);
    }
}

function FromRecord(schema: TRecord, analysis: SchemaAnalysis) {
    if (!analysis.hasTransform && TypeGuard.IsSchema(schema.additionalProperties)) {
        analysis.hasTransform = TypeGuard.IsTransform(schema.additionalProperties);
    }

    const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
    const property = schema.patternProperties[pattern ?? ''];

    if (TypeGuard.IsSchema(property)) {
        Visit(property, analysis);
    }
}

function FromRef(schema: TRef, analysis: SchemaAnalysis) {
    Visit(Deref(schema, [...analysis.references.values()]), analysis);
}

function FromTuple(schema: TTuple, analysis: SchemaAnalysis) {
    if (schema.items) {
        schema.items.forEach(schema => Visit(schema, analysis));
    }
}

function FromUnion(schema: TUnion, analysis: SchemaAnalysis) {
    schema.anyOf.forEach(schema => Visit(schema, analysis));
}

function Visit(schema: TSchema, analysis: SchemaAnalysis): void {
    analysis.hasTransform = analysis.hasTransform || TypeGuard.IsTransform(schema);
    analysis.hasDefault = analysis.hasDefault || 'default' in schema;

    if (schema.$id) {
        if (analysis.references.has(schema.$id)) return;
        analysis.references.set(schema.$id, schema);
    }

    switch (schema[Kind]) {
        case 'Array':
            return FromArray(schema as TSchema as TArray, analysis);
        case 'Intersect':
            return FromIntersect(schema as TSchema as TIntersect, analysis);
        case 'Object':
            return FromObject(schema as TSchema as TObject, analysis);
        case 'Record':
            return FromRecord(schema as TSchema as TRecord, analysis);
        case 'Ref':
            return FromRef(schema as TSchema as TRef, analysis);
        case 'Tuple':
            return FromTuple(schema as TSchema as TTuple, analysis);
        case 'Union':
            return FromUnion(schema as TSchema as TUnion, analysis);
    }
}

export interface SchemaAnalysis {
    hasTransform: boolean;
    hasDefault: boolean;
    references: Map<string, TSchema>;
}

export const analyzeSchema = (schema: TSchema): SchemaAnalysis => {
    const analysis = { hasTransform: false, hasDefault: false, references: new Map() };
    Visit(schema, analysis);
    return analysis;
};
