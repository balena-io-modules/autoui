import * as arrayType from "./array";
import * as stringType from "./string";
import * as objectType from "./object";
import * as booleanType from "./boolean";
import * as numberType from "./number";
import * as enumType from "./enum";
import * as oneOfType from "./oneOf";
import * as dateTimeType from "./date-time";

import {
  JSONSchema7Definition as JSONSchemaDefinition,
  JSONSchema7TypeName as JSONSchemaTypeName,
} from "json-schema";
import { JSONSchema } from "rendition";

type ExcludeLiteral<T, U> = T extends U ? never : T;

type PartialJSONSchemaTypeName = ExcludeLiteral<
  JSONSchemaTypeName,
  "integer" | "null"
>;

type DataTypeModule = {
  operators: (property?: JSONSchemaDefinition) => Record<string, string>;
};

export type TransformedDataTypeModule = {
  operators: Record<string, string>;
  operatorsOneOf: JSONSchema["oneOf"];
};

const dataTypeMap: Record<PartialJSONSchemaTypeName, DataTypeModule> = {
  array: arrayType,
  string: stringType,
  object: objectType,
  boolean: booleanType,
  number: numberType,
};

const transformModule = (
  module: DataTypeModule,
  property: JSONSchemaDefinition
): TransformedDataTypeModule => {
  const operators = module.operators(property);
  const operatorsOneOf = Object.entries(operators).map(([key, value]) => ({
    title: value,
    const: key,
  }));
  return {
    operators,
    operatorsOneOf,
  };
};

// This function will retrieve the data type model based on the property type.
// if the JSONSchema property is a number, it will get DataTypes/number.tsx.
export const getDataModel = (
  property: JSONSchemaDefinition | undefined
): TransformedDataTypeModule | null => {
  if (!property || typeof property === "boolean") {
    return null;
  }
  let module: DataTypeModule | undefined;
  const { format, type, enum: propertyEnum, oneOf } = property;
  try {
    if (propertyEnum) {
      module = enumType;
    } else if (oneOf) {
      module = oneOfType;
    } else if (format?.endsWith("date-time")) {
      module = dateTimeType;
    } else {
      if (!type) {
        return null;
      }
      const typeSet = Array.isArray(type) ? type : [type];
      const dataTypeKey = Object.keys(dataTypeMap).find(
        (t: PartialJSONSchemaTypeName) => typeSet.includes(t)
      );
      if (!dataTypeKey) {
        return null;
      }
      module = dataTypeMap[dataTypeKey as PartialJSONSchemaTypeName];
    }
  } catch (error) {
    console.error("Error loading component", error);
    throw error;
  }
  return transformModule(module, property);
};
