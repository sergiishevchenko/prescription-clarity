"use client";

import dynamic from "next/dynamic";
import React from "react";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div style={{ minHeight: "100dvh" }}>
      <SwaggerUI
        url="/api/openapi"
        docExpansion="list"
        defaultModelsExpandDepth={0}
      />
    </div>
  );
}
