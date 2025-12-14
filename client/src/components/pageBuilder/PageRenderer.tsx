import React from "react";
import { PageSection, CustomPage } from "../../types/pageBuilder";
import SectionRenderer from "./SectionRenderer";

interface PageRendererProps {
  page: CustomPage;
  sections: PageSection[];
}

const PageRenderer: React.FC<PageRendererProps> = ({ page, sections }) => {
  React.useEffect(() => {
    const animatedSections = Array.from(
      document.querySelectorAll<HTMLElement>(".page-section-animated"),
    );

    if (animatedSections.length > 0) {
      document.body.classList.add("scroll-animations-ready");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.25 },
    );

    animatedSections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      document.body.classList.remove("scroll-animations-ready");
    };
  }, [sections]);

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
