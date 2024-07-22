import type {
	JSONSchema7 as JSONSchema,
	JSONSchema7Definition as JSONSchemaDefinition,
} from 'json-schema';
import {
	convertRefSchemeToSchemaPath,
	getRefSchemeTitle,
	getRefSchemePrefix,
	isJSONSchema,
	parseDescription,
	parseDescriptionProperty,
} from '../schemaOps';

const X_FOREIGN_KEY_SCHEMA_SEPARATOR = '___ref_scheme_separator_';

export const removeFieldsWithNoFilter = (schema: JSONSchema): JSONSchema => {
	const processProperties = (
		properties: JSONSchema['properties'] | undefined,
		parentXNoFilterSet?: Set<string>,
	): JSONSchema['properties'] | undefined => {
		if (!properties) {
			return undefined;
		}

		const newProperties: JSONSchema['properties'] = {};
		for (const [key, value] of Object.entries(properties)) {
			// if boolean keep boolean values as is
			if (typeof value === 'boolean') {
				newProperties[key] = value;
				continue;
			}
			// Apply removal logic in case our parent has defined an array x-no-filter for its children
			// TODO: This only works with immediate children and NOT with nested properties.
			if (parentXNoFilterSet?.has(key)) {
				continue;
			}
			// Extract x-no-filter if available
			const xNoFilter = parseDescriptionProperty(value, 'x-no-filter');

			if (xNoFilter === true) {
				// Exclude property entirely if xNoFilter is true
				continue;
			}

			const newValue: JSONSchemaDefinition = { ...value };
			const xNoFilterSet = Array.isArray(xNoFilter)
				? new Set(xNoFilter)
				: undefined;

			if ('properties' in value) {
				newValue.properties = processProperties(value.properties, xNoFilterSet);
			}

			// we are not considering the case where items is an array. Should be added if necessary
			if (
				value.items &&
				typeof value.items === 'object' &&
				!Array.isArray(value.items)
			) {
				if ('properties' in value.items) {
					newValue.items = {
						...value.items,
						properties: processProperties(value.items.properties, xNoFilterSet),
					};
				}
			}

			newProperties[key] = newValue;
		}

		return newProperties;
	};

	if (schema.properties) {
		schema = {
			...schema,
			properties: processProperties(schema.properties),
		};
	}
	return schema;
};

/**
 * Constructs a schema or modifies properties of an existing schema based on a reference scheme path.
 * This function recursively applies changes to nested properties or items based on the transformed reference scheme.
 *
 * @param schemaOrProperties - The schema or the properties part of a schema to modify.
 * @param transformedXRefScheme - An array of property names extracted from a reference scheme, indicating the path through the schema.
 * @param description - Optional new description to apply to the schema at the specified path.
 * @param title - Optional new title to apply to the schema at the specified path; defaults to existing title if not provided.
 * @returns A new schema definition with modifications applied as per the reference scheme path.
 */
export const constructSchemaProperties = (
	schemaOrProperties: JSONSchemaDefinition,
	transformedXRefScheme: string[] | undefined,
	description?: string,
	title?: string,
): JSONSchemaDefinition => {
	// Return the original schema if there is nothing to transform or no path is provided.
	if (
		schemaOrProperties == null ||
		!transformedXRefScheme?.length ||
		!isJSONSchema(schemaOrProperties)
	) {
		return schemaOrProperties;
	}

	// Deconstruct the transformedXRefScheme into the first key and the rest of the path.
	const [firstRefSchemeKey, ...restRefScheme] = transformedXRefScheme;

	// If the current level is a JSON schema and has properties || items definition, apply the transformation to them.
	if (schemaOrProperties.properties ?? schemaOrProperties.items) {
		return {
			...schemaOrProperties,
			title: title ?? schemaOrProperties.title, // Use provided title or default to existing title.
			description, // Apply the new description.
			[schemaOrProperties.properties ? 'properties' : 'items']:
				constructSchemaProperties(
					schemaOrProperties.properties ??
						(schemaOrProperties.items as JSONSchema),
					restRefScheme,
					description,
				), // Recurse into properties/items.
		};
	}

	// If the first key of the reference scheme is present, process this specific property.
	if (firstRefSchemeKey) {
		const property = (
			schemaOrProperties as NonNullable<JSONSchema['properties']>
		)[firstRefSchemeKey as keyof typeof schemaOrProperties];

		// Throw an error if the property key does not exist in the schema.
		if (!property) {
			throw new Error(
				`ERROR: x-ref-scheme/x-foreign-scheme bad declaration, key ${firstRefSchemeKey} not found`,
			);
		}

		// Recursively construct properties for the specific key found in the ref scheme.
		return {
			[firstRefSchemeKey]: constructSchemaProperties(
				property,
				restRefScheme,
				description,
				title,
			),
		};
	}

	// Return the schema unchanged if none of the above conditions apply.
	return schemaOrProperties;
};

/**
 * Modifies a schema to apply special processing rules, such as handling ref schemes.
 */
export const modifySchemaWithRefSchemes = (schema: JSONSchema): JSONSchema => {
	const applyRefSchemeModifications = (
		properties: JSONSchema['properties'] | undefined,
	): JSONSchema['properties'] | undefined => {
		if (!properties) {
			return undefined;
		}

		const newProperties: JSONSchema['properties'] = {};
		for (const [key, value] of Object.entries(properties)) {
			if (typeof value === 'boolean') {
				newProperties[key] = value;
				continue;
			}
			const description = parseDescription(value);
			const refScheme =
				description?.['x-foreign-key-scheme'] ?? description?.['x-ref-scheme'];
			delete description?.['x-foreign-key-scheme'];
			delete description?.['x-ref-scheme'];

			if (refScheme?.length) {
				for (const xRefScheme of refScheme) {
					const transformedXRefScheme =
						convertRefSchemeToSchemaPath(xRefScheme);
					const title = getRefSchemeTitle(transformedXRefScheme, value);
					const entireRefScheme =
						getRefSchemePrefix(value) + transformedXRefScheme;
					if (transformedXRefScheme && description) {
						description['x-ref-scheme'] = [transformedXRefScheme];
					}
					const propertyKey =
						refScheme.length > 1
							? `${key}${X_FOREIGN_KEY_SCHEMA_SEPARATOR}${xRefScheme}`
							: key;
					newProperties[propertyKey] = constructSchemaProperties(
						value,
						entireRefScheme?.split('.'),
						JSON.stringify(description),
						title,
					);
				}
			} else {
				newProperties[key] = value;
			}
		}

		return newProperties;
	};

	return schema.properties
		? { ...schema, properties: applyRefSchemeModifications(schema.properties) }
		: schema;
};

/**
 * Removes separators added to denote x-ref-scheme modifications from filter names.
 */
export const removeRefSchemeSeparatorsFromFilters = (
	filters: JSONSchema[],
): JSONSchema[] => {
	const recursivelyRemoveSeparators = (filter: JSONSchema): JSONSchema => {
		return {
			...filter,
			anyOf: filter.anyOf?.map((f) => {
				if (isJSONSchema(f) && f.anyOf) {
					return recursivelyRemoveSeparators(f);
				}
				if (!isJSONSchema(f) || !f.properties) {
					return f;
				}

				return {
					...f,
					properties: Object.fromEntries(
						Object.entries(f.properties).map(([key, value]) => {
							const newKey = key.split(X_FOREIGN_KEY_SCHEMA_SEPARATOR)[0];
							return [newKey, value];
						}),
					),
					required: f.required?.map(
						(r) => r.split(X_FOREIGN_KEY_SCHEMA_SEPARATOR)[0],
					),
				};
			}),
		};
	};

	return filters.map(recursivelyRemoveSeparators);
};
