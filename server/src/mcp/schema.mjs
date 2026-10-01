// Een kleine validator voor het deel van JSON Schema dat de tools gebruiken, zonder dependencies (ADR-004,
// sectie 8). De server toetst er de argumenten van een tool mee; de tests ook elk antwoord aan het outputSchema.
//
//   validate(schema, value)  →  een lijst van problemen, in het Nederlands; leeg als de waarde klopt
//
// Gekend: type (ook een lijst, bv. ['string', 'null']), enum, required, properties, additionalProperties (false of
// een schema), items, minLength, maxLength, minItems, maxItems, minimum en maximum. 'description', 'default' en
// 'title' zijn uitleg en tellen niet mee.

const TYPES = {
    object: (value) => value !== null && typeof value === 'object' && !Array.isArray(value),
    array: Array.isArray,
    string: (value) => typeof value === 'string',
    integer: Number.isInteger,
    number: (value) => typeof value === 'number' && Number.isFinite(value),
    boolean: (value) => typeof value === 'boolean',
    null: (value) => value === null,
};

const show = (value) => JSON.stringify(value);

export function validate(schema, value, where = 'de invoer') {
    const problems = [];
    check(schema, value, where, problems);
    return problems;
}

function check(schema, value, where, problems) {
    if (!schema || typeof schema !== 'object') return;
    const types = schema.type == null ? null : [].concat(schema.type);
    if (types) {
        if (!types.some((type) => TYPES[type]?.(value))) {
            problems.push(`${where} moet van het type ${types.join(' of ')} zijn, niet ${show(value)}.`);
            return;
        }
    }
    if (schema.enum && !schema.enum.some((option) => option === value)) {
        problems.push(`${where} moet een van ${schema.enum.map(show).join(', ')} zijn, niet ${show(value)}.`);
    }
    if (typeof value === 'string') {
        if (schema.minLength != null && value.length < schema.minLength) {
            problems.push(`${where} moet minstens ${schema.minLength} tekens lang zijn.`);
        }
        if (schema.maxLength != null && value.length > schema.maxLength) {
            problems.push(`${where} mag hoogstens ${schema.maxLength} tekens lang zijn, niet ${value.length}.`);
        }
    }
    if (typeof value === 'number') {
        if (schema.minimum != null && value < schema.minimum) {
            problems.push(`${where} moet minstens ${schema.minimum} zijn.`);
        }
        if (schema.maximum != null && value > schema.maximum) {
            problems.push(`${where} mag hoogstens ${schema.maximum} zijn, niet ${value}.`);
        }
    }
    if (Array.isArray(value)) {
        if (schema.minItems != null && value.length < schema.minItems) {
            problems.push(`${where} moet minstens ${schema.minItems} elementen hebben.`);
        }
        if (schema.maxItems != null && value.length > schema.maxItems) {
            problems.push(`${where} mag hoogstens ${schema.maxItems} elementen hebben, niet ${value.length}.`);
        }
        if (schema.items) value.forEach((item, index) => check(schema.items, item, `${where}[${index}]`, problems));
    }
    if (TYPES.object(value)) {
        for (const key of schema.required ?? []) {
            if (!(key in value)) problems.push(`${where} mist '${key}'.`);
        }
        const properties = schema.properties ?? {};
        for (const [key, item] of Object.entries(value)) {
            if (key in properties) {
                check(properties[key], item, `${where}.${key}`, problems);
            } else if (schema.additionalProperties === false) {
                const known = Object.keys(properties);
                const allowed = known.length > 0 ? ` Gekend: ${known.join(', ')}.` : '';
                problems.push(`${where} kent '${key}' niet.${allowed}`);
            } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
                check(schema.additionalProperties, item, `${where}.${key}`, problems);
            }
        }
    }
}
