import React from "react";
import IndesignOpForm from "./indesignOpForm";

const UseCaseForm = ({ id, onFormChange, setUploadFiles }) => {
  switch (id) {
    case "IndesignDocs":
      return (
        <IndesignOpForm
          action="BrandedContentGeneration"
          onChange={onFormChange}
          setUploadFiles={setUploadFiles}
        />
      )
    default:
      return <>Nothing to be display</>;
  }
};

export default UseCaseForm;
