import React from "react";
import { PageBlock, CustomPage } from "../../../types/pageBuilder";
import HeroBlock from "./HeroBlock";
import TextBlock from "./TextBlock";
import TextImageBlock from "./TextImageBlock";
import ImageBlock from "./ImageBlock";
import CtaBlock from "./CtaBlock";
import FeaturesListBlock from "./FeaturesListBlock";
import ProductListBlock from "./ProductListBlock";
import ArticlesListBlock from "./ArticlesListBlock";
import TestimonialsListBlock from "./TestimonialsListBlock";
import SpacerBlock from "./SpacerBlock";

interface BlockRendererProps {
  block: PageBlock;
  page: CustomPage;
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ block, page }) => {
  switch (block.type) {
    case "HERO":
      return <HeroBlock data={block.data} pageKey={page.key} />;
    case "TEXT":
      return <TextBlock data={block.data} />;
    case "TEXT_IMAGE":
      return <TextImageBlock data={block.data} />;
    case "IMAGE":
      return <ImageBlock data={block.data} />;
    case "CTA":
      return <CtaBlock data={block.data} />;
    case "FEATURES_LIST":
      return <FeaturesListBlock data={block.data} />;
    case "PRODUCT_LIST":
      return <ProductListBlock data={block.data} />;
    case "ARTICLES_LIST":
      return <ArticlesListBlock data={block.data} />;
    case "TESTIMONIALS_LIST":
      return <TestimonialsListBlock data={block.data} />;
    case "SPACER":
      return <SpacerBlock data={block.data} />;
    default:
      return (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 p-4 text-xs text-slate-500">
          Bloc {block.type} non pris en charge
        </div>
      );
  }
};

export default BlockRenderer;
