import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import app from "./src/app.js";
import roomSocket from "./src/sockets/roomSocket.js";
import Room from "./src/models/Room.js"; // Import Room model

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
  roomSocket(io, socket);

  // Print all current rooms from MongoDB with player usernames
  const rooms = await Room.find();
  if (rooms.length > 0) {
    console.log("💡 Current Rooms in DB:");
    rooms.forEach((room) => {
      console.log(`Room ID: ${room._id}`);
      console.log(`Type   : ${room.type}-player`);
      console.log(`Status : ${room.status}`);
      console.log("Players:");
      room.players.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.username} (ID: ${p.userId})`);
      });
      console.log("------------------------");
    });
  } else {
    console.log("No rooms in DB currently.");
  }

;

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
