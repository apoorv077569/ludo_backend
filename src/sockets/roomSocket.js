import Room from "../models/Room.js";

const roomSocket = (io, socket) => {
  console.log("🔥 Socket connected:", socket.id);

  socket.on("joingame", async ({ userId, type, username }) => {
    console.log("🎯 joingame event received:", { userId, type, username });

    try {
      if (![2, 4].includes(type)) {
        console.log("Invalid room type:", type);
        return socket.emit("error", "Invalid room type. Allowed types are 2 or 4");
      }

      // 1️⃣ Block user if already in any room (waiting or full)
      const existingRoom = await Room.findOne({
        "players.userId": userId
      });

      if (existingRoom) {
        console.log("❌ User already in another room:", userId);
        return socket.emit("error", "User already in a room");
      }

      // 2️⃣ Try to find an existing waiting room of the requested type (oldest first)
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
          players: [{ userId, username }], // Save username for first player
          status: "waiting",
        });
        await room.save();
      }

      // 3️⃣ Join socket room
      socket.join(room._id.toString());

      // 4️⃣ Prepare formatted response
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
