import VideoPlayer from "@/components/VideoPlayer";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">🎬 My Notes</h1>
      <VideoPlayer />
    </div>
  );
}
