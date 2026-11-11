/* Put this file at app/opengraph-image.tsx
   Next.js turns it into the preview picture shown when your link is shared (WhatsApp, Instagram, X, Facebook). */
import { ImageResponse } from "next/og";

export const alt = "IWAHH,perfume house";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 0%, #5a0a12 0%, #1b0808 45%, #070303 100%)",
          color: "#f7f2ee",
        }}
      >
        <div style={{ fontSize: 30, letterSpacing: 10, color: "#e9cfa9", marginBottom: 28, display: "flex" }}>
          SMALL-BATCH PARFUMERIE
        </div>
        <div style={{ fontSize: 190, letterSpacing: 28, lineHeight: 1, display: "flex" }}>IWAHH</div>
        <div style={{ width: 160, height: 2, background: "#b3122a", margin: "36px 0", display: "flex" }} />
        <div style={{ fontSize: 34, color: "rgba(247,242,238,0.7)", display: "flex" }}>
          Distilled in Grasse. Delivered across India.
        </div>
      </div>
    ),
    { ...size }
  );
}
