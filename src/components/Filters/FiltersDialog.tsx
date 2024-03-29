import React, { useCallback, useMemo, useState } from "react";
import {
  DialogWithCloseButton,
  IChangeEvent,
  Material,
  RJSForm,
} from "@balena/ui-shared-components";
import { useTranslation } from "../../hooks/useTranslation";
import type {
  JSONSchema7 as JSONSchema,
  JSONSchema7Definition as JSONSchemaDefinition,
} from "json-schema";
import { getDataModel } from "../../DataTypes";
import {
  getDefaultValueByType,
  getPropertySchema,
  isJSONSchema,
} from "./SchemaSieve";

interface FormData {
  field: string | undefined;
  operator: string | undefined;
  value: string | undefined;
}

const { DialogContent } = Material;

interface FiltersDialogProps {
  open: boolean;
  schema: JSONSchema;
  onClose:
    | ((event: {}, reason: "backdropClick" | "escapeKeyDown") => void)
    | undefined;
}

// We are only considering that the schema properties will be string/number/boolean type.
// arrays and objects are not considered for now, as I think we can flat the schema.
export const FiltersDialog = ({
  schema,
  open,
  onClose,
}: FiltersDialogProps) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData[] | undefined>([
    {
      field: undefined,
      operator: undefined,
      value: undefined,
    },
  ]);

  const handleChange = useCallback(
    ({ formData }: IChangeEvent<FormData[]>) => {
      setFormData(formData);
    },
    [setFormData, formData]
  );

  const handleSubmit = ({ formData }: IChangeEvent<FormData[]>) => {
    console.log("handleSubmit", formData);
  };

  const internalSchema = useMemo(() => {
    const properties = schema.properties;
    if (!properties) {
      return;
    }

    const oneOf = Object.entries(properties)
      // since properties is of type JSONSchemaDefinition = JSONSchema | boolean, we need to remove all the boolean
      .filter(
        ([_k, v]: [string, JSONSchemaDefinition]) => typeof v !== "boolean"
      )
      .map(([key, property]: [string, JSONSchema]) => ({
        title: property.title,
        const: key,
      }));

    return {
      type: "array",
      items: formData?.map((data) => {
        const propertySchema = getPropertySchema(
          data.field ?? oneOf[0].const,
          schema
        );
        const schemaField = {
          type: "string",
          oneOf: oneOf,
          default: data.field ?? oneOf[0].const,
        };
        const operatorOneOf = getDataModel(propertySchema)?.operatorsOneOf ?? [
          { title: "is", const: "is" },
          { title: "is not", const: "is_not" },
        ];
        const isSelectedOperatorAvailable = operatorOneOf.some(
          (operator: JSONSchema) => operator.const === data.operator
        );
        return {
          type: "object",
          properties: {
            field: schemaField,
            operator: {
              type: "string",
              oneOf: operatorOneOf,
              default:
                isSelectedOperatorAvailable && data.operator != null
                  ? data.operator
                  : isJSONSchema(operatorOneOf[0])
                  ? operatorOneOf[0].const
                  : "",
            },
            value: {
              type: propertySchema?.type || "string",
              default:
                data.value ??
                getDefaultValueByType(propertySchema?.type ?? "string"),
            },
          },
          required: ["property"],
        };
      }),
      additionalItems: {
        type: "object",
        properties: {
          field: formData?.[0].field,
          operator: formData?.[0].operator,
        },
      },
    };
  }, [formData, schema, setFormData]);

  return !internalSchema ? null : (
    <DialogWithCloseButton
      title={t("labels.add_filters")}
      onClose={onClose}
      open={open}
    >
      <DialogContent>
        <RJSForm
          width={"100%"}
          onChange={handleChange}
          onSubmit={handleSubmit}
          schema={internalSchema}
        />
      </DialogContent>
    </DialogWithCloseButton>
  );
};
