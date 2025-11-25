import React from "react";
import LegalPageRenderer from "./LegalPageRenderer";

const ConfidentialitePage: React.FC = () => {
  return (
    <LegalPageRenderer
      pageKey="CONFIDENTIALITE"
      defaultTitle="Politique de confidentialité"
      defaultDescription="Comprenez comment ComptaMatch traite et protège vos données personnelles."
    />
  );
};

export default ConfidentialitePage;
