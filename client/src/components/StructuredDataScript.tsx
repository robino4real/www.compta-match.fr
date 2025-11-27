import React from "react";

type StructuredDataScriptProps = {
  data?: any[] | Record<string, any> | null;
};

const StructuredDataScript: React.FC<StructuredDataScriptProps> = ({ data }) => {
  if (!data) return null;
  const payload = Array.isArray(data) ? data : [data];
  if (payload.length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
};

export default StructuredDataScript;
