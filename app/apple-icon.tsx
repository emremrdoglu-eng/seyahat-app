import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
        }}
      >
        <svg
          width="70%"
          height="70%"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C7.58 2 4 5.58 4 10c0 5.25 6.72 11.19 7.11 11.52a1.5 1.5 0 0 0 1.78 0C13.28 21.19 20 15.25 20 10c0-4.42-3.58-8-8-8z"
            fill="#10b981"
          />
          <circle cx="12" cy="10" r="3" fill="#09090b" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
