import React from "react";

interface SpacerBlockProps {
  data: any;
}

const sizeToClass = {
  small: "h-4",
  medium: "h-8",
  large: "h-16",
};

const SpacerBlock: React.FC<SpacerBlockProps> = ({ data }) => {
  const size = data?.size as keyof typeof sizeToClass;
  const cls = sizeToClass[size] || sizeToClass.medium;
  return <div className={cls} aria-hidden />;
};

export default SpacerBlock;
