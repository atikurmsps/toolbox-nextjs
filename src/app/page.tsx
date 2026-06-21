import ImageExifEditor from "@/components/ImageExifEditor";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-8">
      <div className="mx-auto mb-6 max-w-5xl">
        <h1 className="text-2xl font-bold sm:text-3xl">Image EXIF Editor</h1>
      </div>
      <ImageExifEditor />
    </main>
  );
}
