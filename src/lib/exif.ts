import piexif, { ExifDict } from "piexifjs";
import { DevicePreset } from "./presets";
import { writePngExif } from "./png";

export interface GpsPoint {
  lat: number;
  lng: number;
}

export const isJpeg = (file: File): boolean =>
  file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name);

export const isPng = (file: File): boolean =>
  file.type === "image/png" || /\.png$/i.test(file.name);

// JPEG and PNG both support a full EXIF rewrite (incl. GPS).
export const isSupported = (file: File): boolean =>
  isJpeg(file) || isPng(file);

const mimeOf = (dataUrl: string): string =>
  dataUrl.slice(5, dataUrl.indexOf(";"));

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const bin = atob(dataUrl.split(",")[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK)
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return `data:${mime};base64,${btoa(bin)}`;
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

// float -> [numerator, denominator]
const rational = (v: number, den = 1000): [number, number] => [
  Math.round(v * den),
  den,
];

// Date -> "YYYY:MM:DD HH:MM:SS"
function exifDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}:${p(d.getMonth() + 1)}:${p(d.getDate())} ${p(
    d.getHours()
  )}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function buildGps(gps: GpsPoint): ExifDict["GPS"] {
  const latRef = gps.lat >= 0 ? "N" : "S";
  const lngRef = gps.lng >= 0 ? "E" : "W";
  return {
    [piexif.GPSIFD.GPSVersionID]: [2, 3, 0, 0],
    [piexif.GPSIFD.GPSLatitudeRef]: latRef,
    [piexif.GPSIFD.GPSLatitude]: piexif.GPSHelper.degToDmsRational(
      Math.abs(gps.lat)
    ),
    [piexif.GPSIFD.GPSLongitudeRef]: lngRef,
    [piexif.GPSIFD.GPSLongitude]: piexif.GPSHelper.degToDmsRational(
      Math.abs(gps.lng)
    ),
    [piexif.GPSIFD.GPSAltitudeRef]: 0,
    [piexif.GPSIFD.GPSAltitude]: [0, 1],
  };
}

export interface BuildOpts {
  preset: DevicePreset;
  gps: GpsPoint;
  dateTime?: Date;
}

function buildExif({ preset, gps, dateTime }: BuildOpts): ExifDict {
  const dt = exifDate(dateTime ?? new Date());
  const zeroth: ExifDict["0th"] = {
    [piexif.ImageIFD.Make]: preset.make,
    [piexif.ImageIFD.Model]: preset.model,
    [piexif.ImageIFD.Software]: preset.software,
    [piexif.ImageIFD.DateTime]: dt,
    [piexif.ImageIFD.Orientation]: 1,
    [piexif.ImageIFD.XResolution]: [72, 1],
    [piexif.ImageIFD.YResolution]: [72, 1],
    [piexif.ImageIFD.ResolutionUnit]: 2,
  };
  const exif: ExifDict["Exif"] = {
    [piexif.ExifIFD.DateTimeOriginal]: dt,
    [piexif.ExifIFD.DateTimeDigitized]: dt,
    [piexif.ExifIFD.LensMake]: preset.make,
    [piexif.ExifIFD.LensModel]: preset.lensModel,
    [piexif.ExifIFD.FNumber]: rational(preset.fNumber, 100),
    // APEX aperture = 2*log2(N)
    [piexif.ExifIFD.ApertureValue]: rational(
      2 * Math.log2(preset.fNumber),
      100
    ),
    // APEX shutter = -log2(exposureTime)
    [piexif.ExifIFD.ShutterSpeedValue]: rational(
      -Math.log2(preset.exposureTime[0] / preset.exposureTime[1]),
      100
    ),
    [piexif.ExifIFD.FocalLength]: rational(preset.focalLength, 1000),
    [piexif.ExifIFD.FocalLengthIn35mmFilm]: preset.focalLength35,
    [piexif.ExifIFD.ExposureTime]: preset.exposureTime,
    [piexif.ExifIFD.ISOSpeedRatings]: preset.iso,
    [piexif.ExifIFD.PixelXDimension]: preset.pixelXDimension,
    [piexif.ExifIFD.PixelYDimension]: preset.pixelYDimension,
    // 0xFFFF = uncalibrated (Apple Display P3), matches real iPhone output
    [piexif.ExifIFD.ColorSpace]: 0xffff,
    [piexif.ExifIFD.WhiteBalance]: 0,
    [piexif.ExifIFD.Flash]: 16,
    [piexif.ExifIFD.MeteringMode]: 5,
    [piexif.ExifIFD.ExposureProgram]: 2,
    [piexif.ExifIFD.SceneCaptureType]: 0,
  };
  return {
    "0th": zeroth,
    Exif: exif,
    GPS: buildGps(gps),
    Interop: {},
    "1st": {},
    thumbnail: null,
  };
}

// piexif.dump() returns the APP1 payload: "Exif\0\0" + raw TIFF.
// PNG eXIf chunks want the raw TIFF only, so drop the 6-byte prefix.
function exifTiffBytes(opts: BuildOpts): Uint8Array {
  const str = piexif.dump(buildExif(opts)).slice(6);
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i) & 0xff;
  return arr;
}

/**
 * Strip ALL existing metadata, then write fresh preset EXIF + GPS.
 * Pixels untouched. Works for JPEG (APP1 segment) and PNG (eXIf chunk).
 */
export function rewriteExif(dataUrl: string, opts: BuildOpts): string {
  const mime = mimeOf(dataUrl);
  if (mime === "image/png") {
    const out = writePngExif(dataUrlToBytes(dataUrl), exifTiffBytes(opts));
    return bytesToDataUrl(out, "image/png");
  }
  const clean = piexif.remove(dataUrl); // removes all EXIF/metadata
  return piexif.insert(piexif.dump(buildExif(opts)), clean);
}

/** Strip metadata only, no new tags. JPEG + PNG. */
export function stripExif(dataUrl: string): string {
  const mime = mimeOf(dataUrl);
  if (mime === "image/png")
    return bytesToDataUrl(writePngExif(dataUrlToBytes(dataUrl)), "image/png");
  return piexif.remove(dataUrl);
}

export function dataURLtoBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
