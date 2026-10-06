"use client";
import { useState } from "react";

export default function VideoPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");

  const handlePlay = () => {
    let input = videoUrl.trim();
    let videoId = "";

    // Handle iframe embed code
    if (input.includes("<iframe")) {
      const srcMatch = input.match(/src="([^"]+)"/);
      if (srcMatch) {
        input = srcMatch[1];
      }
    }

    // Extract YouTube video ID from various formats
    if (input.includes("watch?v=")) {
      // Format: https://www.youtube.com/watch?v=5MWT_doo68k
      videoId = input.split("watch?v=")[1].split("&")[0].split("?")[0];
    } else if (input.includes("youtu.be/")) {
      // Format: https://youtu.be/5MWT_doo68k
      videoId = input.split("youtu.be/")[1].split("?")[0];
    } else if (input.includes("youtube.com/embed/")) {
      // Format: https://www.youtube.com/embed/5MWT_doo68k
      videoId = input.split("youtube.com/embed/")[1].split("?")[0];
    } else if (input.includes("youtube.com/live/")) {
      // Format: https://www.youtube.com/live/5MWT_doo68k
      videoId = input.split("youtube.com/live/")[1].split("?")[0];
    } else {
      // Assume it's just a video ID
      videoId = input;
    }

    // Add parameters including autoplay
    const url = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0`;

    setEmbedUrl(url);
    setIsOpen(false);
  };

  return (
    <>
      {embedUrl ? (
        <div className="relative w-full max-w-2xl aspect-video border border-gray-700 rounded-lg overflow-hidden shadow-lg">
          <iframe
            className="w-full h-full"
            src={embedUrl}
            title="YouTube Player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <p className="text-gray-400 mb-4">No video loaded yet</p>
      )}

      <button
        onClick={() => setIsOpen(true)}
        className="mt-6 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition"
      >
        Add YouTube Video
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <h2 className="text-2xl font-semibold mb-4 text-center">Add YouTube Link</h2>
            <input
              type="text"
              placeholder="Paste YouTube link or iframe here..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePlay}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                Play
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
