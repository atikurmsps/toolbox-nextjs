import ImageExifEditor from "@/components/ImageExifEditor";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-8">
      <div className="mx-auto mb-8 max-w-5xl">
        <h1 className="text-2xl font-bold sm:text-3xl">Image EXIF Editor</h1>
        <p className="mt-2 text-sm text-slate-500">
          Upload images — all metadata &amp; GPS is stripped automatically, then
          spoofed with a device preset and your chosen location. Pixels are never
          modified. Everything runs locally in your browser.
        </p>
      </div>
      <ImageExifEditor />
    </main>
  );
}
