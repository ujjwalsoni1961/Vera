"use client";

import { useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import { latLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteWidget } from "@/lib/engine-core/types";

// ────────────────────────────────────────────────────────────────────────────
// Real map for route widgets (Leaflet + CARTO light tiles). Old plan dashed,
// new plan in accent blue, numbered stops. Loaded client-side only.
// ────────────────────────────────────────────────────────────────────────────

const STOP_COLORS: Record<string, string> = {
  depot: "#A16207",
  technician: "#16A34A",
  site: "#2563EB",
};

export default function RouteMap({ widget }: { widget: RouteWidget }) {
  const bounds = useMemo(() => {
    const pts: [number, number][] = [
      ...widget.stops.map((s) => [s.lat, s.lng] as [number, number]),
      ...(widget.oldPath ?? []),
      ...widget.newPath,
    ];
    return latLngBounds(pts).pad(0.25);
  }, [widget]);

  return (
    <MapContainer
      bounds={bounds}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      className="z-0 h-[260px] w-full"
      style={{ background: "#FAFAFA" }}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      {widget.oldPath && (
        <Polyline
          positions={widget.oldPath}
          pathOptions={{
            color: "#A1A1AA",
            weight: 2,
            dashArray: "6 6",
            opacity: 0.8,
          }}
        />
      )}
      <Polyline
        positions={widget.newPath}
        pathOptions={{ color: "#2563EB", weight: 3, opacity: 0.9 }}
      />
      {widget.stops.map((stop) => (
        <CircleMarker
          key={stop.label}
          center={[stop.lat, stop.lng]}
          radius={7}
          pathOptions={{
            color: "#FFFFFF",
            weight: 2,
            fillColor: STOP_COLORS[stop.kind ?? "site"],
            fillOpacity: 1,
          }}
        >
          <Tooltip
            permanent
            direction="top"
            offset={[0, -8]}
            className="vera-map-tooltip"
          >
            {stop.order ? `${stop.order} · ${stop.label}` : stop.label}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
