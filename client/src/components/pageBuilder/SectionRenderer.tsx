import React from "react";
import { PageSection, CustomPage } from "../../types/pageBuilder";
import BlockRenderer from "./blocks/BlockRenderer";

interface SectionRendererProps {
  section: PageSection;
  page: CustomPage;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ section, page }) => {
  const bgClass = section.backgroundColor || "bg-transparent";
  const hasBackgroundImage = Boolean(section.backgroundImageUrl);
  const style = hasBackgroundImage
    ? {
        backgroundImage: `url(${section.backgroundImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <section
      className={`${bgClass} w-full py-10 md:py-14`}
      style={style}
      aria-label={section.label || undefined}
    >
      <div className="container mx-auto px-4">
        {section.blocks
          ?.slice()
          .sort((a, b) => a.order - b.order)
          .map((block) => (
            <div key={block.id} className="mb-10 last:mb-0">
              <BlockRenderer block={block} page={page} />
            </div>
          ))}
      </div>
    </section>
  );
};

export default SectionRenderer;
