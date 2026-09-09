import { ImageResponse } from "next/og";
import { getPublicGuideData } from "./data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ kullanici: string }>;
};

export default async function Image({ params }: Props) {
  const { kullanici } = await params;
  const data = await getPublicGuideData(kullanici);

  const placeCount = data?.places.length ?? 0;
  const cityCount = data
    ? new Set(data.places.map((p) => p.city_name)).size
    : 0;

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
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, color: "#a1a1aa", display: "flex" }}>
          Seyahat Rehberi
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            marginTop: 16,
            display: "flex",
          }}
        >
          {data ? data.username : kullanici}
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#d4d4d8",
            marginTop: 32,
            display: "flex",
          }}
        >
          {placeCount > 0
            ? `${placeCount} mekan · ${cityCount} şehir`
            : "Mekan listesi"}
        </div>
      </div>
    ),
    { ...size }
  );
}
