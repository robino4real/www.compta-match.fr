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
  const backgroundSize = (section.settings as any)?.backgroundSize || "cover";
  const style = hasBackgroundImage
    ? {
        backgroundImage: `url(${section.backgroundImageUrl})`,
        backgroundSize,
        backgroundPosition: "center",
      }
    : undefined;

  const animation = (section.settings as any)?.animation || "none";
  const shouldAnimate = animation && animation !== "none";
  const animationClass = shouldAnimate ? `page-section-animated animate-${animation}` : "";

  return (
    <section
      className={`${bgClass} w-full py-10 md:py-14 ${animationClass}`}
      style={style}
      aria-label={section.label || undefined}
      data-animation={animation}
    >
      <div className="container mx-auto px-4">
        {section.blocks
          ?.slice()
          .sort((a, b) => a.order - b.order)
          .map((block, index) => (
            <div
              key={block.id}
              className={`mb-10 last:mb-0 ${shouldAnimate ? "section-anim-item" : ""}`}
              style={
                shouldAnimate && animation === "staggered"
                  ? { transitionDelay: `${index * 120}ms` }
                  : undefined
              }
            >
              <BlockRenderer block={block} page={page} />
            </div>
          ))}
      </div>
    </section>
  );
};

export default SectionRenderer;
