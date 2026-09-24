import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
          background: "#050505",
          color: "#edeae4",
        }}
      >
        <div style={{ fontSize: 64 }}>Daniel Dominguez</div>
        <div style={{ fontSize: 32, color: "#8a8681", marginTop: 16 }}>Photography</div>
      </div>
    ),
    { ...size }
  );
}
