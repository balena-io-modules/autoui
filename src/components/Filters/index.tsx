import React, { useState } from "react";
import { JSONSchema } from "rendition";
import { Material } from "@balena/ui-shared-components";
import { useTranslation } from "../../hooks/useTranslation";
import { Search } from "./Search";
import { Views } from "./Views";
import { FiltersDialog } from "./FiltersDialog";

const { Box, Button } = Material;

interface FiltersView {
  id: string;
  eventName: string;
  name: string;
  filters: JSONSchema[];
}

type FilterRenderMode = "all" | "add" | "search" | "views" | "summary";

export interface FiltersProps {
  schema: JSONSchema;
  filters?: JSONSchema[];
  views?: FiltersView[];
  onFiltersChange?: (filters: JSONSchema[]) => void;
  onViewsChange?: (views: FiltersView[]) => void;
  renderMode?: FilterRenderMode | FilterRenderMode[];
  onSearch?: (searchTerm: string) => React.ReactElement | null;
}

export const Filters = ({
  schema,
  filters,
  views,
  onFiltersChange,
  onViewsChange,
  renderMode,
  onSearch,
}: FiltersProps) => {
  const { t } = useTranslation();
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  return (
    <Box>
      <Search />
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => setShowFilterDialog(true)}
      >
        {t("actions.add_filter")}
      </Button>
      <Views views={views} />
      <FiltersDialog
        open={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        schema={schema}
      />
    </Box>
  );
};
