"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PRESETS, DEFAULT_GPS, DevicePreset } from "@/lib/presets";
import {
  GpsPoint,
  isSupported,
  fileToDataURL,
  rewriteExif,
  stripExif,
  dataURLtoBlob,
} from "@/lib/exif";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
  ),
});

interface Item {
  id: string;
  file: File;
  original: string; // data URL (already metadata-stripped)
  processed: string; // data URL with new EXIF
  supported: boolean; // JPEG or PNG
  error?: string;
}

let uid = 0;
const nextId = () => `img-${Date.now()}-${uid++}`;

export default function ImageExifEditor() {
  const [items, setItems] = useState<Item[]>([]);
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [gps, setGps] = useState<GpsPoint>(DEFAULT_GPS);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const preset = PRESETS.find((p) => p.id === presetId) as DevicePreset;

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const incoming = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      const built = await Promise.all(
        incoming.map(async (file): Promise<Item> => {
          const supported = isSupported(file);
          const dataUrl = await fileToDataURL(file);
          try {
            // Step 2: auto-clean ALL metadata on upload.
            const cleaned = supported ? stripExif(dataUrl) : dataUrl;
            // Step 3: apply current preset + GPS.
            const processed = supported
              ? rewriteExif(cleaned, { preset, gps })
              : cleaned;
            return {
              id: nextId(),
              file,
              original: cleaned,
              processed,
              supported,
            };
          } catch (e) {
            return {
              id: nextId(),
              file,
              original: dataUrl,
              processed: dataUrl,
              supported,
              error: (e as Error).message,
            };
          }
        })
      );
      setItems((prev) => [...prev, ...built]);
    },
    [preset, gps]
  );

  // Re-apply current preset + GPS to every item.
  const applyAll = useCallback(() => {
    setItems((prev) =>
      prev.map((it) => {
        if (!it.supported) return it;
        try {
          return {
            ...it,
            processed: rewriteExif(it.original, { preset, gps }),
            error: undefined,
          };
        } catch (e) {
          return { ...it, error: (e as Error).message };
        }
      })
    );
  }, [preset, gps]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const download = (it: Item) => {
    const blob = dataURLtoBlob(it.processed);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = it.file.name.replace(/\.[^.]+$/, "");
    const ext = it.processed.startsWith("data:image/png") ? "png" : "jpg";
    a.href = url;
    a.download = `${base}-exif.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAll = () => items.filter((i) => i.supported).forEach(download);
  const remove = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));
  const clearAll = () => setItems([]);

  const editableCount = items.filter((i) => i.supported).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragging
            ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40"
            : "border-slate-300 hover:border-sky-400 dark:border-slate-700"
        }`}
      >
        <p className="text-lg font-medium">Drag &amp; drop images here</p>
        <p className="mt-1 text-sm text-slate-500">
          or click to browse · batch supported · JPEG &amp; PNG full EXIF rewrite
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Controls */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
          <label className="text-sm font-semibold">Device preset</label>
          <select
            value={presetId}
            onChange={(e) => setPresetId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="text-xs text-slate-500">
            <div>Make / Model: {preset.make} {preset.model}</div>
            <div>Software: {preset.software}</div>
            <div>Lens: {preset.lensModel}</div>
            <div>
              ƒ/{preset.fNumber} · {preset.focalLength35}mm · ISO {preset.iso}
            </div>
          </div>

          <label className="mt-2 text-sm font-semibold">GPS coordinates</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              value={gps.lat}
              onChange={(e) =>
                setGps((g) => ({ ...g, lat: parseFloat(e.target.value) || 0 }))
              }
              className="w-1/2 rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
              placeholder="Latitude"
            />
            <input
              type="number"
              step="any"
              value={gps.lng}
              onChange={(e) =>
                setGps((g) => ({ ...g, lng: parseFloat(e.target.value) || 0 }))
              }
              className="w-1/2 rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"
              placeholder="Longitude"
            />
          </div>
          <button
            onClick={() => setGps(DEFAULT_GPS)}
            className="self-start text-xs text-sky-600 hover:underline"
          >
            Reset to default location
          </button>

          <button
            onClick={applyAll}
            disabled={!items.length}
            className="mt-2 rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-40"
          >
            Apply preset &amp; GPS to all
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <p className="mb-2 px-2 text-sm font-semibold">
            Pick GPS location (click map)
          </p>
          <MapPicker point={gps} onPick={(p) => setGps(p)} />
        </div>
      </div>

      {/* List */}
      {items.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {items.length} file(s) · {editableCount} editable
            </p>
            <div className="flex gap-2">
              <button
                onClick={downloadAll}
                disabled={!editableCount}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
              >
                Download all
              </button>
              <button
                onClick={clearAll}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-700"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.processed}
                  alt={it.file.name}
                  className="h-40 w-full rounded-lg object-cover"
                />
                <p className="truncate text-xs font-medium" title={it.file.name}>
                  {it.file.name}
                </p>
                {it.supported ? (
                  <p className="text-[11px] text-emerald-600">
                    ✓ cleaned · {preset.label} · {gps.lat.toFixed(4)},{" "}
                    {gps.lng.toFixed(4)}
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-600">
                    cleaned · unsupported type (use JPEG/PNG)
                  </p>
                )}
                {it.error && (
                  <p className="text-[11px] text-red-500">{it.error}</p>
                )}
                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => download(it)}
                    disabled={!it.supported}
                    className="flex-1 rounded-md bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700 disabled:opacity-40"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => remove(it.id)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
