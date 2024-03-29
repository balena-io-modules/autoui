import React from "react";
import { DropDownButton, Tooltip } from "@balena/ui-shared-components";
import { faChartPie } from "@fortawesome/free-solid-svg-icons/faChartPie";
import { JSONSchema7 as JSONSchema } from "json-schema";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "../../hooks/useTranslation";

interface FiltersView {
  id: string;
  eventName: string;
  name: string;
  filters: JSONSchema[];
}

export interface ViewsProps {
  views: FiltersView[] | undefined;
}

export const Views = ({ views }: ViewsProps) => {
  const { t } = useTranslation();
  return (
    <Tooltip title={!views?.length ? t("labels.info_no_views") : undefined}>
      <DropDownButton<FiltersView>
        disabled={!views?.length}
        items={views ?? ([] as FiltersView[])}
        children={t("labels.views")}
        color="secondary"
        variant="outlined"
        startIcon={<FontAwesomeIcon icon={faChartPie} />}
      />
    </Tooltip>
  );
};
