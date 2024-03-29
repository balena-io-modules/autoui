import {
  JSONSchema7 as JSONSchema,
  JSONSchema7Definition as JSONSchemaDefinition,
  JSONSchema7Type as JSONSchemaType,
} from "json-schema";

export const isJSONSchema = (
  value: JSONSchema | JSONSchemaDefinition
): value is JSONSchema => {
  return typeof value === "object" && value !== null;
};

export const getPropertySchema = (key: string, schema: JSONSchema) => {
  if (!schema.properties) {
    return;
  }
  const propertySchema = schema.properties[key];
  return isJSONSchema(propertySchema) ? propertySchema : undefined;
};

export const getDefaultValueByType = (type: JSONSchemaType) => {
  switch (type) {
    case "string":
      return "";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "object":
      return {};
    case "array":
      return [];
    default:
      null;
      break;
  }
};
