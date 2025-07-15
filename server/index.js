const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // temporarily allow all during dev; restrict in prod
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// 👉 Serve React static files
app.use(express.static(path.join(__dirname, "..", "client", "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "dist", "index.html"));
});

// 🔌 WebRTC socket logic
io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", { socketId: socket.id });
  });

  socket.on("offer", ({ target, offer }) => {
    io.to(target).emit("offer", { sender: socket.id, offer });
  });

  socket.on("answer", ({ target, answer }) => {
    io.to(target).emit("answer", { sender: socket.id, answer });
  });

  socket.on("ice-candidate", ({ target, candidate }) => {
    io.to(target).emit("ice-candidate", { sender: socket.id, candidate });
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("user-left", { socketId: socket.id });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
