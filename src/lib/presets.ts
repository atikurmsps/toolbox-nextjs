// Device metadata presets. Values approximate real EXIF written by these phones.
export interface DevicePreset {
  id: string;
  label: string;
  make: string;
  model: string;
  software: string; // iOS / OneUI version string
  lensMake?: string;
  lensModel: string;
  fNumber: number; // aperture
  focalLength: number; // mm (actual)
  focalLength35: number; // 35mm equiv
  exposureTime: [number, number]; // [num, den] e.g. [1, 120]
  iso: number;
  pixelXDimension: number;
  pixelYDimension: number;
}

export const PRESETS: DevicePreset[] = [
  {
    // Real EXIF captured from owner's iPhone 16 Pro (IMG_9959.HEIC). Default.
    id: "iphone16pro",
    label: "iPhone 16 Pro (my camera)",
    make: "Apple",
    model: "iPhone 16 Pro",
    software: "26.3",
    lensMake: "Apple",
    lensModel: "iPhone 16 Pro back triple camera 6.765mm f/1.78",
    fNumber: 1.78,
    focalLength: 6.765,
    focalLength35: 24,
    exposureTime: [1, 60],
    iso: 320,
    pixelXDimension: 5712,
    pixelYDimension: 4284,
  },
  {
    id: "iphone17promax",
    label: "iPhone 17 Pro Max",
    make: "Apple",
    model: "iPhone 17 Pro Max",
    software: "26.0",
    lensModel: "iPhone 17 Pro Max back triple camera 6.765mm f/1.78",
    fNumber: 1.78,
    focalLength: 6.765,
    focalLength35: 24,
    exposureTime: [1, 120],
    iso: 64,
    pixelXDimension: 8064,
    pixelYDimension: 6048,
  },
  {
    id: "iphone17pro",
    label: "iPhone 17 Pro",
    make: "Apple",
    model: "iPhone 17 Pro",
    software: "26.0",
    lensModel: "iPhone 17 Pro back triple camera 6.765mm f/1.78",
    fNumber: 1.78,
    focalLength: 6.765,
    focalLength35: 24,
    exposureTime: [1, 120],
    iso: 64,
    pixelXDimension: 8064,
    pixelYDimension: 6048,
  },
  {
    id: "iphone17",
    label: "iPhone 17",
    make: "Apple",
    model: "iPhone 17",
    software: "26.0",
    lensModel: "iPhone 17 back dual camera 5.96mm f/1.6",
    fNumber: 1.6,
    focalLength: 5.96,
    focalLength35: 26,
    exposureTime: [1, 100],
    iso: 80,
    pixelXDimension: 8064,
    pixelYDimension: 6048,
  },
  {
    id: "iphone16promax",
    label: "iPhone 16 Pro Max",
    make: "Apple",
    model: "iPhone 16 Pro Max",
    software: "18.5",
    lensModel: "iPhone 16 Pro Max back triple camera 6.765mm f/1.78",
    fNumber: 1.78,
    focalLength: 6.765,
    focalLength35: 24,
    exposureTime: [1, 120],
    iso: 80,
    pixelXDimension: 8064,
    pixelYDimension: 6048,
  },
  {
    id: "iphone16",
    label: "iPhone 16",
    make: "Apple",
    model: "iPhone 16",
    software: "18.5",
    lensModel: "iPhone 16 back dual camera 5.96mm f/1.6",
    fNumber: 1.6,
    focalLength: 5.96,
    focalLength35: 26,
    exposureTime: [1, 100],
    iso: 80,
    pixelXDimension: 8064,
    pixelYDimension: 6048,
  },
  {
    id: "s25ultra",
    label: "Samsung Galaxy S25 Ultra",
    make: "samsung",
    model: "SM-S938B",
    software: "S938BXXU1AXL8",
    lensModel: "Samsung Galaxy S25 Ultra Rear Camera",
    fNumber: 1.7,
    focalLength: 6.3,
    focalLength35: 23,
    exposureTime: [1, 100],
    iso: 50,
    pixelXDimension: 12000,
    pixelYDimension: 9000,
  },
  {
    id: "s24ultra",
    label: "Samsung Galaxy S24 Ultra",
    make: "samsung",
    model: "SM-S928B",
    software: "S928BXXU1AXK5",
    lensModel: "Samsung Galaxy S24 Ultra Rear Camera",
    fNumber: 1.7,
    focalLength: 6.3,
    focalLength35: 23,
    exposureTime: [1, 100],
    iso: 50,
    pixelXDimension: 12000,
    pixelYDimension: 9000,
  },
  {
    id: "pixel9pro",
    label: "Google Pixel 9 Pro",
    make: "Google",
    model: "Pixel 9 Pro",
    software: "Hph_2025",
    lensModel: "Pixel 9 Pro back camera 6.9mm f/1.68",
    fNumber: 1.68,
    focalLength: 6.9,
    focalLength35: 25,
    exposureTime: [1, 120],
    iso: 55,
    pixelXDimension: 8160,
    pixelYDimension: 6144,
  },
];

// Default GPS — Dallas, TX area per requirement.
export const DEFAULT_GPS = {
  lat: 32.910876717145435,
  lng: -96.83953586638997,
};
