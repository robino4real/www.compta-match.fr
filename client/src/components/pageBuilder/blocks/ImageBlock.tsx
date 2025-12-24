import React from "react";
import { resolveAssetUrl } from "../../../lib/resolveAssetUrl";

interface ImageBlockProps {
  data: any;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ data }) => {
  const { imageUrl, alt, imageSize = "large" } = data || {};
  if (!imageUrl) return null;

  const sizeClasses: Record<string, string> = {
    small: "max-h-56 max-w-md",
    medium: "max-h-72 max-w-3xl",
    large: "max-h-[480px] max-w-5xl",
    full: "max-h-[640px] w-full",
  };

  const imageClasses = sizeClasses[imageSize] || sizeClasses.large;

  return (
    <div className="flex justify-center">
      <img
        src={resolveAssetUrl(imageUrl)}
        alt={alt || "Image"}
        className={`${imageClasses} w-full object-contain`}
      />
    </div>
  );
};

export default ImageBlock;
