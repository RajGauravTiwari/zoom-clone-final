import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

function Home() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = () => {
    if (name.trim() === "") return;
    const roomId = uuidv4().slice(0, 6); // Shorter room ID
    navigate(`/room/${roomId}`, { state: { name } });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-gray-100">
      <h1 className="text-3xl font-bold">Welcome to Zoom-Lite</h1>
      <input
        type="text"
        placeholder="Enter your name"
        className="px-4 py-2 border rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        onClick={handleCreateRoom}
        className="bg-blue-500 text-white px-6 py-2 rounded"
      >
        Create Room
      </button>
    </div>
  );
}

export default Home;
