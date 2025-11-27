import React from "react";

interface ImageBlockProps {
  data: any;
}

const ImageBlock: React.FC<ImageBlockProps> = ({ data }) => {
  const { imageUrl, alt } = data || {};
  if (!imageUrl) return null;

  return (
    <div className="flex justify-center">
      <img
        src={imageUrl}
        alt={alt || "Image"}
        className="max-h-[480px] w-full max-w-4xl rounded-2xl object-cover shadow-md"
      />
    </div>
  );
};

export default ImageBlock;
