"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="th">
      <body style={{ fontFamily: "sans-serif", padding: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>เกิดข้อผิดพลาด</h2>
        <p style={{ marginTop: 8 }}>
          {error?.message || "Unknown error"}
        </p>
        {error?.digest ? (
          <p style={{ marginTop: 8, opacity: 0.8 }}>digest: {error.digest}</p>
        ) : null}

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button
            onClick={() => reset()}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            ลองใหม่
          </button>

          <button
            onClick={() => navigator.clipboard.writeText(String(error?.stack || error?.message || ""))}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Copy stack
          </button>
        </div>

        <pre
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            background: "#111",
            color: "#eee",
            overflow: "auto",
            maxHeight: "60vh",
            whiteSpace: "pre-wrap",
          }}
        >
          {error?.stack || "(no stack)"}
        </pre>
      </body>
    </html>
  );
}
