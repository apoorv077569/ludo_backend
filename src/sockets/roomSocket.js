import Room from "../models/Room.js";

const roomSocket = (io, socket) => {
  console.log("🔥 Socket connected:", socket.id);

  // 🎯 Join game event
  socket.on("joingame", async ({ userId, type, username }) => {
    console.log("🎯 joingame event received:", { userId, type, username });

    try {
      if (![2, 4].includes(type)) {
        console.log("Invalid room type:", type);
        return socket.emit("error", "Invalid room type. Allowed types are 2 or 4");
      }

      // 1️⃣ Block user if already in any room
      const existingRoom = await Room.findOne({ "players.userId": userId });
      if (existingRoom) {
        console.log("❌ User already in another room:", userId);
        return socket.emit("error", "User already in a room");
      }

      // 2️⃣ Try to find existing waiting room
      let room = await Room.findOne({ type, status: "waiting" }).sort({ createdAt: 1 });

      if (room) {
        console.log("🟢 Found waiting room:", room._id);

        room.players.push({ userId, username });

        if (room.players.length === type) {
          room.status = "full";
          console.log("🎉 Room full now:", room._id);
        }

        await room.save();
      } else {
        console.log("⚪ No waiting room found, creating new room...");
        room = new Room({
          type,
          players: [{ userId, username }],
          status: "waiting",
        });
        await room.save();
      }

      // 3️⃣ Join socket.io room
      socket.join(room._id.toString());

      // 4️⃣ Format response
      const roomObj = room.toObject();
      const { _id, ...rest } = roomObj;
      const formattedRoom = { roomId: _id, ...rest };

      console.log("📢 Broadcasting roomUpdate:", formattedRoom);
      io.to(room._id.toString()).emit("roomUpdate", formattedRoom);
    } catch (err) {
      console.error("❌ Error in joingame:", err);
      socket.emit("error", "Failed to join/create room");
    }
  });

  // 🎯 Leave room event
  socket.on("leaveroom", async ({ roomId, userId }) => {
    try {
      console.log("🚪 leaveroom event received:", { roomId, userId });

      const room = await Room.findById(roomId);
      if (!room) {
        return socket.emit("error", "Room not found");
      }

      const playerIndex = room.players.findIndex(
        (p) => p.userId.toString() === userId
      );

      if (playerIndex === -1) {
        return socket.emit("error", "User not in this room");
      }

      // Remove player from room
      room.players.splice(playerIndex, 1);

      // Leave socket.io room
      socket.leave(roomId);

      if (room.players.length === 0) {
        await Room.findByIdAndDelete(roomId);
        io.to(roomId).emit("roomClosed", { roomId });
        console.log("❌ Room closed:", roomId);
        return;
      }

      // If room was full but now isn’t, reset status
      if (room.status === "full") {
        room.status = "waiting";
      }

      await room.save();

      const formattedRoom = {
        roomId: room._id,
        type: room.type,
        players: room.players,
        status: room.status,
      };

      // Notify others in the room
      io.to(roomId).emit("roomUpdate", formattedRoom);

      // Confirm to the leaving socket
      socket.emit("leftRoom", { roomId });
      console.log("✅ User left room:", { roomId, userId });
    } catch (err) {
      console.error("❌ Error in leaveroom:", err);
      socket.emit("error", "Failed to leave room");
    }
  });
};

export default roomSocket;
