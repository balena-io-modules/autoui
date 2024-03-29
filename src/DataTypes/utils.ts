// import type { JSONSchema7 as JSONSchema } from "json-schema";
import memoize from "lodash/memoize";

// export const getJsonDescription = (
//   title: string | undefined,
//   field: string,
//   operator: Operator<OperatorSlugs>,
//   value: string,
//   label: string | undefined,
//   refScheme: string | undefined
// ) => {
//   return JSON.stringify({
//     title,
//     field,
//     operator,
//     value,
//     label,
//     refScheme,
//   });
// };

// export type CreateFilter<TOperatorSlugs> = (
//   field: string,
//   operator: Operator<TOperatorSlugs>,
//   value: any,
//   subSchema: JSONSchema,
//   refScheme?: string
// ) => JSONSchema;

export const getDefaultDate = (): string => {
  const date = new Date();
  return date.toISOString().split(".")[0];
};

// Normalize a timestamp to a RFC3339 timestamp, which is required for JSON schema.
export const normalizeDateTime = memoize(
  (timestamp: string | number, type?: "string" | "number") => {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) {
      return null;
    }
    return type === "number"
      ? d.getTime()
      : d.toISOString().split(".")[0] + "Z"; // Remove miliseconds;
  }
);
