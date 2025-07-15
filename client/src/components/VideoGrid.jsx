import { useEffect, useRef } from "react";

function VideoTile({ stream, name, isLocal }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="flex flex-col items-center p-2">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // 🔇 local stream muted to prevent echo
        className="w-64 h-48 bg-black rounded-md border-2 border-white object-cover"
      />
      <p className="text-white text-sm mt-1">{name}</p>
    </div>
  );
}

function VideoGrid({ streams }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-900">
      {streams.map((s) => (
        <VideoTile
          key={s.id}
          stream={s.stream}
          name={s.name || "Participant"}
          isLocal={s.isLocal}
        />
      ))}
    </div>
  );
}

export default VideoGrid;
