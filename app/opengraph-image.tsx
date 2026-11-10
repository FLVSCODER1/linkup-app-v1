import { ImageResponse } from "next/og";

export const alt =
  "LinkUp — discover events, clubs, and people in your school community";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at 80% 15%, #7c3aed 0, #4338ca 22%, #111827 58%, #09090b 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "960px",
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#c4b5fd",
              display: "flex",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            LinkUp
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 94,
              fontWeight: 800,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              marginTop: 28,
            }}
          >
            Find what fits.
          </div>
          <div
            style={{
              color: "#d4d4d8",
              display: "flex",
              fontSize: 38,
              lineHeight: 1.35,
              marginTop: 34,
            }}
          >
            Discover events, clubs, and people at your school.
          </div>
        </div>
      </div>
    ),
    size,
  );
}

