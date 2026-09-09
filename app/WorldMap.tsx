"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import {
  ISO_NUMERIC_TO_ALPHA2,
  UNLINKED_FEATURE_NAME_TO_ALPHA2,
  deriveMapData,
} from "@/lib/worldMap";
import type { Place } from "@/lib/places";

type Props = {
  places: Place[];
};

type WorldFeature = {
  type: "Feature";
  id?: string | number;
  properties?: { name?: string };
  geometry: GeoJSON.Geometry;
};

type Topology = {
  type: "Topology";
  objects: Record<string, unknown>;
};

const WIDTH = 960;
const HEIGHT = 500;
const MIN_SCALE = 1;
const MAX_SCALE = 8;
const CITY_PIN_SCALE_THRESHOLD = 2.5;

type View = {
  scale: number;
  translate: [number, number];
};

export default function WorldMap({ places }: Props) {
  const [countries, setCountries] = useState<WorldFeature[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>({
    scale: MIN_SCALE,
    translate: [0, 0],
  });
  const { scale, translate } = view;

  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    let ignore = false;

    fetch("/data/world-countries-50m.json")
      .then((res) => res.json())
      .then((topology: Topology) => {
        if (ignore) return;
        const objectKey = Object.keys(topology.objects)[0];
        const collection = feature(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          topology as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          topology.objects[objectKey] as any
        );
        const features =
          "features" in collection ? collection.features : [collection];
        setCountries(features as WorldFeature[]);
      })
      .catch((err) => {
        if (!ignore) setLoadError(String(err));
      });

    return () => {
      ignore = true;
    };
  }, []);

  const { visitedCountryCodes, cityPins, uniqueCityCount } = useMemo(
    () => deriveMapData(places),
    [places]
  );

  const projection = useMemo(() => {
    const proj = geoNaturalEarth1();
    if (countries && countries.length > 0) {
      proj.fitSize(
        [WIDTH, HEIGHT],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { type: "FeatureCollection", features: countries } as any
      );
    }
    return proj;
  }, [countries]);

  const countryPaths = useMemo(() => {
    if (!countries) return [];
    const pathGenerator = geoPath(projection);
    return countries.map((f, index) => {
      const alpha2 =
        (f.id != null && ISO_NUMERIC_TO_ALPHA2[String(f.id)]) ||
        (f.properties?.name &&
          UNLINKED_FEATURE_NAME_TO_ALPHA2[f.properties.name]) ||
        null;
      return {
        key: `${f.id ?? f.properties?.name ?? "feature"}-${index}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        d: pathGenerator(f as any) ?? "",
        visited: alpha2 ? visitedCountryCodes.has(alpha2) : false,
      };
    });
  }, [countries, projection, visitedCountryCodes]);

  const pinPositions = useMemo(() => {
    return cityPins
      .map((pin) => {
        const coords = projection([pin.lon, pin.lat]);
        if (!coords) return null;
        return { name: pin.name, x: coords[0], y: coords[1] };
      })
      .filter((p): p is { name: string; x: number; y: number } => p !== null);
  }, [cityPins, projection]);

  function clampScale(next: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
  }

  // Converts a client (screen) point into the SVG's own viewBox coordinate
  // space, independent of how the viewBox is currently scaled to fit the
  // element on screen.
  function toViewBoxPoint(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(ctm.inverse());
  }

  // `factor` is a multiplier applied to whatever the scale turns out to be
  // at commit time, so rapid/batched calls (e.g. a fast wheel gesture)
  // always compound against the latest value instead of a stale closure.
  //
  // `p` is the fixed point (in the SVG's own, untransformed viewBox space)
  // under the cursor. To keep the same map point under the cursor after
  // scaling, the new translate is: p + r * (oldTranslate - p), where r is
  // the ratio actually applied to the scale (newScale / oldScale).
  function zoomAround(clientX: number, clientY: number, factor: number) {
    const p = toViewBoxPoint(clientX, clientY);
    setView(({ scale: s, translate: [tx, ty] }) => {
      const clamped = clampScale(s * factor);
      if (!p) return { scale: clamped, translate: [tx, ty] };
      const r = clamped / s;
      return {
        scale: clamped,
        translate: [p.x + r * (tx - p.x), p.y + r * (ty - p.y)],
      };
    });
  }

  function handleWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    const factor = 1 + -e.deltaY * 0.002;
    zoomAround(e.clientX, e.clientY, factor);
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      pinchDistanceRef.current = getPinchDistance();
    }
  }

  function getPinchDistance() {
    const pts = Array.from(pointers.current.values());
    if (pts.length < 2) return null;
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.hypot(dx, dy);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const dist = getPinchDistance();
      if (dist !== null && pinchDistanceRef.current) {
        const ratio = dist / pinchDistanceRef.current;
        const pts = Array.from(pointers.current.values());
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        zoomAround(midX, midY, ratio);
        pinchDistanceRef.current = dist;
      }
      return;
    }

    if (pointers.current.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      setView((v) => ({
        scale: v.scale,
        translate: [v.translate[0] + dx, v.translate[1] + dy],
      }));
    }
  }

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDistanceRef.current = null;
  }

  function handleDoubleClick() {
    setView({ scale: MIN_SCALE, translate: [0, 0] });
  }

  const showPins = scale >= CITY_PIN_SCALE_THRESHOLD;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {visitedCountryCodes.size} ülke
        </span>
        <span className="font-medium text-zinc-900 dark:text-zinc-50">
          {uniqueCityCount} şehir
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {loadError ? (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
            Harita yüklenemedi: {loadError}
          </div>
        ) : !countries ? (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
            Harita yükleniyor...
          </div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full touch-none select-none"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onDoubleClick={handleDoubleClick}
          >
            <g
              transform={`translate(${translate[0]},${translate[1]}) scale(${scale})`}
            >
              {countryPaths.map((c) => (
                <path
                  key={c.key}
                  d={c.d}
                  vectorEffect="non-scaling-stroke"
                  className={
                    c.visited
                      ? "fill-emerald-500/80 stroke-emerald-700 dark:fill-emerald-500/70 dark:stroke-emerald-300"
                      : "fill-zinc-200 stroke-zinc-300 dark:fill-zinc-800 dark:stroke-zinc-700"
                  }
                  strokeWidth={0.5}
                />
              ))}
              {showPins &&
                pinPositions.map((p, i) => (
                  <circle
                    key={`${p.name}-${i}`}
                    cx={p.x}
                    cy={p.y}
                    r={3 / scale}
                    className="fill-red-500 stroke-white dark:stroke-zinc-900"
                    strokeWidth={1 / scale}
                  />
                ))}
            </g>
          </svg>
        )}
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        Yakınlaştırmak için kaydır ya da iki parmakla sıkıştır, taşımak için
        sürükle
      </p>
    </div>
  );
}
