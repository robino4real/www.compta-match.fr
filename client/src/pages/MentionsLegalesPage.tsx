import React from "react";
import LegalPageRenderer from "./LegalPageRenderer";

const MentionsLegalesPage: React.FC = () => {
  return (
    <LegalPageRenderer
      pageKey="MENTIONS_LEGALES"
      defaultTitle="Mentions légales"
      defaultDescription="Retrouvez les informations légales et de contact de ComptaMatch."
    />
  );
};

export default MentionsLegalesPage;
