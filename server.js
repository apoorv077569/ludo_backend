import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import app from "./src/app.js";
import roomSocket from "./src/sockets/roomSocket.js";
import  gameSocket  from "./src/sockets/game.socket.js";

dotenv.config();

// ✅ Connect to MongoDB
connectDB();

// ✅ Create HTTP server
const server = http.createServer(app);


// ✅ Create Socket.IO server
const io = new Server(server, {
  cors: { origin: "*" } // allow all origins for testing
});

// ✅ Handle Socket.IO connections
io.on("connection", async (socket) => {
  console.log("🔗 Client connected:", socket.id);

  // Attach room and game socket handlers
  roomSocket(io, socket);
  gameSocket(io, socket);

 

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

