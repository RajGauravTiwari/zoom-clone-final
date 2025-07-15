import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5000"; // Change if deployed
let socket;
let localStream;
const peers = {};
let setStreamsFn = () => {};

export async function initConnection(roomId, setStreams) {
  setStreamsFn = setStreams;
  socket = io(SOCKET_SERVER_URL);

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    console.log("✅ Got local stream:", localStream);

    setStreamsFn((prev) => {
      if (prev.find((s) => s.id === "local")) return prev;
      return [...prev, { stream: localStream, id: "local", isLocal: true }];
    });
  } catch (err) {
    console.error("❌ Failed to access camera/mic:", err);
    alert("Camera and microphone access is required.");
    return;
  }

  socket.emit("join-room", { roomId });

  socket.on("user-joined", async ({ socketId }) => {
    console.log(`📞 Creating offer for ${socketId}`);

    if (peers[socketId]) return;

    const peerConnection = createPeerConnection(socketId);
    peers[socketId] = peerConnection;

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("offer", { target: socketId, offer });
  });

  socket.on("offer", async ({ sender, offer }) => {
    console.log(`📨 Received offer from ${sender}`);

    if (!peers[sender]) {
      const peerConnection = createPeerConnection(sender);
      peers[sender] = peerConnection;
    }

    const peer = peers[sender];

    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    socket.emit("answer", { target: sender, answer });
  });

  socket.on("answer", async ({ sender, answer }) => {
    console.log(`📨 Received answer from ${sender}`);

    const peer = peers[sender];
    if (!peer) {
      console.warn("⚠️ No peer found for", sender);
      return;
    }

    if (peer.signalingState === "stable") {
      console.warn("⚠️ Peer already stable, skipping duplicate answer");
      return;
    }

    try {
      await peer.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error("❌ Failed to set remote answer:", err);
    }
  });

  socket.on("ice-candidate", async ({ sender, candidate }) => {
    const peer = peers[sender];
    if (candidate && peer) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("⚠️ Failed to add ICE candidate:", err);
      }
    }
  });

  socket.on("user-left", ({ socketId }) => {
    console.log(`👋 ${socketId} left the room`);

    if (peers[socketId]) {
      peers[socketId].close();
      delete peers[socketId];
    }

    setStreamsFn((prev) => prev.filter((s) => s.id !== socketId));
  });
}

function createPeerConnection(socketId) {
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  if (localStream) {
    localStream.getTracks().forEach((track) => {
      peer.addTrack(track, localStream);
    });
  }

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        target: socketId,
        candidate: event.candidate
      });
    }
  };

  peer.ontrack = (event) => {
    console.log("📹 Received remote stream from", socketId);

    setStreamsFn((prev) => {
      if (prev.find((s) => s.id === socketId)) return prev;
      return [...prev, { stream: event.streams[0], id: socketId, isLocal: false }];
    });
  };

  peer.onconnectionstatechange = () => {
    console.log(`🔄 Peer ${socketId} state:`, peer.connectionState);
  };

  return peer;
}

export function leaveRoom() {
  console.log("🛑 Leaving room");

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }

  Object.values(peers).forEach((peer) => peer.close());
  Object.keys(peers).forEach((id) => delete peers[id]);

  if (socket) {
    socket.disconnect();
  }
}
