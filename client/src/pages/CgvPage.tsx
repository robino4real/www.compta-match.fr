import React from "react";
import LegalPageRenderer from "./LegalPageRenderer";

const CgvPage: React.FC = () => {
  return (
    <LegalPageRenderer
      pageKey="CGV"
      defaultTitle="Conditions générales de vente"
      defaultDescription="Consultez les conditions générales de vente applicables aux offres ComptaMatch."
    />
  );
};

export default CgvPage;
