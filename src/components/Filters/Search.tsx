import React from "react";
import { Material } from "@balena/ui-shared-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons/faSearch";

const { Input, InputAdornment } = Material;

interface SearchProps {}

export const Search = ({}: SearchProps) => {
  return (
    <Input
      startAdornment={
        <InputAdornment position="start">
          <FontAwesomeIcon icon={faSearch} />
        </InputAdornment>
      }
    />
  );
};
