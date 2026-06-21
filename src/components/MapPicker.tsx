"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GpsPoint } from "@/lib/exif";

// Fix default marker icons (Next bundler breaks the relative asset paths).
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onPick }: { onPick: (p: GpsPoint) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ point }: { point: GpsPoint }) {
  const map = useMap();
  useEffect(() => {
    map.setView([point.lat, point.lng]);
  }, [point.lat, point.lng, map]);
  return null;
}

export default function MapPicker({
  point,
  onPick,
}: {
  point: GpsPoint;
  onPick: (p: GpsPoint) => void;
}) {
  return (
    <MapContainer
      center={[point.lat, point.lng]}
      zoom={13}
      scrollWheelZoom
      style={{ height: 320, width: "100%", borderRadius: 12 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[point.lat, point.lng]} icon={icon} />
      <ClickHandler onPick={onPick} />
      <Recenter point={point} />
    </MapContainer>
  );
}
