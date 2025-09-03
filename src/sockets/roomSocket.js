import Room from "../models/Room.js";

const roomSocket = (io, socket) => {
  console.log("🔥 Socket connected:", socket.id);

  socket.on("joingame", async ({ userId, type, username }) => {
    console.log("🎯 joingame event received:", { userId, type });

    try {
      if (![2, 4].includes(type)) {
        console.log("Invalid room type:", type);
        return socket.emit("error", "Invalid room type. Allowed types are 2 or 4");
      }

      // Find existing waiting room of given type
      let room = await Room.findOne({ type, status: "waiting" });

      if (room) {
        console.log("🟢 Found waiting room:", room._id);

        const alreadyInRoom = room.players.some(p => p.userId === userId);
        if (alreadyInRoom) {
          console.log("❌ User already in room:", userId);
          return socket.emit("error", "User already in room");
        }

        room.players.push({ userId, username });
        if (room.players.length === type) {
          room.status = "full";
          console.log("🎉 Room full now:", room._id);
        }

        await room.save();
      } else {
        console.log("⚪ No room found, creating new room...");
        room = new Room({
          type,
          players: [{ userId }],
          status: "waiting",
        });
        await room.save();
      }

      // Join socket room
      socket.join(room._id.toString());

      // Prepare formatted response
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
};

export default roomSocket;
