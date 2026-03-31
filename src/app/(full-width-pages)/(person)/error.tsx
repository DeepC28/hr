"use client";

import React, { useEffect } from "react";

export default function PersonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PersonError]", error);
  }, [error]);

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>
        Person pages error
      </h2>
      <p style={{ marginTop: 8 }}>{error?.message}</p>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        digest: {error?.digest || "-"}
      </p>

      <button
        onClick={() => reset()}
        style={{
          marginTop: 12,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #ccc",
          cursor: "pointer",
        }}
      >
        ลองใหม่
      </button>

      <pre
        style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: "#111",
          color: "#eee",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          maxHeight: "60vh",
        }}
      >
        {error?.stack || "(no stack)"}
      </pre>
    </div>
  );
}
