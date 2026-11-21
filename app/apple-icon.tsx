import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", borderRadius: "38px", background: "#173f2d", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "104px", height: "130px", borderRadius: "9px", background: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "60px", height: "8px", borderRadius: "8px", background: "#0b8b62" }} />
        <div style={{ width: "60px", height: "8px", borderRadius: "8px", background: "#0b8b62" }} />
        <div style={{ width: "42px", height: "8px", borderRadius: "8px", background: "#0b8b62" }} />
      </div>
    </div>,
    size
  );
}
