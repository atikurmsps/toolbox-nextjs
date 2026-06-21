declare module "piexifjs" {
  type IfdDict = Record<number, unknown>;
  export interface ExifDict {
    "0th": IfdDict;
    Exif: IfdDict;
    GPS: IfdDict;
    Interop: IfdDict;
    "1st": IfdDict;
    thumbnail: string | null;
  }
  export const ImageIFD: Record<string, number>;
  export const ExifIFD: Record<string, number>;
  export const GPSIFD: Record<string, number>;
  export const GPSHelper: {
    degToDmsRational(deg: number): [number, number][];
    dmsRationalToDeg(dms: [number, number][], ref: string): number;
  };
  export function dump(exif: ExifDict): string;
  export function load(jpegData: string): ExifDict;
  export function insert(exifStr: string, jpegData: string): string;
  export function remove(jpegData: string): string;
  const _default: {
    ImageIFD: Record<string, number>;
    ExifIFD: Record<string, number>;
    GPSIFD: Record<string, number>;
    GPSHelper: typeof GPSHelper;
    dump: typeof dump;
    load: typeof load;
    insert: typeof insert;
    remove: typeof remove;
  };
  export default _default;
}
