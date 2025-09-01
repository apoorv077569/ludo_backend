import Room from "../models/Room.js";
import User from "../models/User.js";

const roomSocket = (io, socket) => {
  console.log("🔥 Socket connected:", socket.id);
  console.log("✅ roomSocket loaded for socket:", socket.id);
  // Listen for join game request
  socket.on("joingame", async ({ userId, type }) => {
    console.log("🎯 joingame event received:", { userId, type });

    try {
      // Fetch user from DB
      const user = await User.findById(userId);
      if (!user) {
        console.log("❌ User not found:", userId);
        return socket.emit("error", "User not found");
      }

      console.log("✅ User found:", user.username);

      // Find existing waiting room of given type
      let room = await Room.findOne({ type, status: "waiting" });

      if (room) {
        console.log("🟢 Found waiting room:", room._id);
        room.players.push({ userId: user._id, username: user.username });

        if (room.players.length === type) {
          room.status = "full";
          console.log("🎉 Room full now:", room._id);
        }

        await room.save();
      } else {
        console.log("⚪ No room found, creating new room...");
        room = new Room({
          type,
          players: [{ userId: user._id, username: user.username }],
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
