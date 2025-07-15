import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import VideoGrid from "../components/VideoGrid";
import { initConnection, leaveRoom } from "../Webrtc";

function Room() {
  const { roomId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const name = state?.name || "Anonymous";

  const [streams, setStreams] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  useEffect(() => {
    initConnection(roomId, setStreams);

    return () => {
      leaveRoom();
    };
  }, [roomId]);

  const handleLeave = () => {
    leaveRoom();
    navigate("/", { replace: true });
  };

  const roomURL = `${window.location.origin}/room/${roomId}`;

  return (
    <div className="flex flex-col items-center h-screen w-screen bg-black text-white">
      {/* Header */}
      <div className="p-4 text-center">
        <h2 className="text-2xl font-semibold">Room: {roomId}</h2>
        <h3 className="text-lg">You are: {name}</h3>
        <div className="my-2">
          <input
            type="text"
            value={roomURL}
            readOnly
            className="px-2 py-1 border rounded bg-gray-100 w-72 text-center text-sm text-black"
            onClick={(e) => e.target.select()}
          />
        </div>
        <button
          onClick={handleLeave}
          className="bg-red-500 text-white px-4 py-2 rounded mt-2"
        >
          Leave Meeting
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-grow w-full">
        <VideoGrid streams={streams} />
      </div>

      {/* Controls */}
      <div className="p-4 flex gap-4">
        <button
          onClick={() => {
            setMicOn((prev) => {
              const newState = !prev;
              streams
                .find((s) => s.isLocal)
                ?.stream.getAudioTracks()
                .forEach((track) => (track.enabled = newState));
              return newState;
            });
          }}
          className={`px-4 py-2 rounded ${micOn ? "bg-green-500" : "bg-gray-400"} text-white`}
        >
          {micOn ? "Mute Mic" : "Unmute Mic"}
        </button>

        <button
          onClick={() => {
            setCameraOn((prev) => {
              const newState = !prev;
              streams
                .find((s) => s.isLocal)
                ?.stream.getVideoTracks()
                .forEach((track) => (track.enabled = newState));
              return newState;
            });
          }}
          className={`px-4 py-2 rounded ${cameraOn ? "bg-green-500" : "bg-gray-400"} text-white`}
        >
          {cameraOn ? "Hide Camera" : "Show Camera"}
        </button>
      </div>
    </div>
  );
}

export default Room;
