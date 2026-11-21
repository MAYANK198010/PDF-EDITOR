import { ImageResponse } from "next/og";

export const alt = "FREE EDITOR — Free online PDF tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: "#f5faf7", padding: "76px", color: "#172b21", fontFamily: "Arial" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "55px" }}>
        <div style={{ width: "76px", height: "76px", borderRadius: "20px", background: "#173f2d", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "42px", fontWeight: 800 }}>F</div>
        <div style={{ fontSize: "36px", fontWeight: 800 }}>FREE EDITOR</div>
      </div>
      <div style={{ fontSize: "76px", fontWeight: 800, lineHeight: 1.12 }}>Free PDF tools.</div>
      <div style={{ fontSize: "68px", fontWeight: 800, color: "#07845b", lineHeight: 1.18 }}>No complicated steps.</div>
      <div style={{ fontSize: "29px", color: "#64748b", marginTop: "32px" }}>Merge · Split · Compress · Convert · Organize</div>
      <div style={{ fontSize: "23px", color: "#173f2d", marginTop: "45px", fontWeight: 600 }}>Files are processed in your browser.</div>
    </div>,
    size
  );
}
