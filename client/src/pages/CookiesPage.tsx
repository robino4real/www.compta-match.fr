import React from "react";
import LegalPageRenderer from "./LegalPageRenderer";

const CookiesPage: React.FC = () => {
  return (
    <LegalPageRenderer
      pageKey="COOKIES"
      defaultTitle="Politique de cookies"
      defaultDescription="Informations sur l'utilisation des cookies et traceurs par ComptaMatch."
    />
  );
};

export default CookiesPage;
