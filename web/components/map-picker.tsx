"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icon in leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

interface Location {
  lat: number;
  lng: number;
  label: string;
}

interface MapPickerProps {
  onLocationSelect: (location: Location) => void;
  defaultLocation?: Location;
}

function LocationMarker({ position, setPosition, onLocationSelect }: any) {
  useMapEvents({
    async click(e) {
      setPosition(e.latlng);
      // Reverse geocoding using Nominatim
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`);
        const data = await res.json();
        const label = data.display_name || `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
        onLocationSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          label
        });
      } catch (err) {
        onLocationSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          label: `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`
        });
      }
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function MapPicker({ onLocationSelect, defaultLocation }: MapPickerProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    defaultLocation ? new L.LatLng(defaultLocation.lat, defaultLocation.lng) : null
  );

  return (
    <div className="w-full h-[300px] rounded-xl overflow-hidden border border-ink-200 relative z-0">
      <MapContainer
        center={position || [6.5244, 3.3792]} // Default to Lagos, Nigeria
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
      </MapContainer>
    </div>
  );
}
