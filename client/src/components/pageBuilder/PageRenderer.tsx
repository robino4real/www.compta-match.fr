import React from "react";
import { PageSection, CustomPage } from "../../types/pageBuilder";
import SectionRenderer from "./SectionRenderer";

interface PageRendererProps {
  page: CustomPage;
  sections: PageSection[];
}

const PageRenderer: React.FC<PageRendererProps> = ({ page, sections }) => {
  return (
    <div className="flex flex-col gap-12">
      {sections
        ?.slice()
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <SectionRenderer key={section.id} section={section} page={page} />
        ))}
    </div>
  );
};

export default PageRenderer;
