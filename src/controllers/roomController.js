import Room from "../models/Room.js";
import User from "../models/User.js";
import roomRouter from "../routes/roomRoutes.js";

// 🔹 Helper to format room consistently
const formatRoom = (room) => ({
  roomId: room._id,
  type: room.type,
  players: room.players,
  status: room.status,
  createdAt: room.createdAt,
  updatedAt: room.updatedAt,
});

// ✅ Create Room
export const createRoom = async (req, res) => {
  try {
    const { type, userId } = req.body;
    if (!type || !userId) {
      return res.status(400).json({ message: "type and userId are required" });
    }

    if (![2, 4].includes(type)) {
      return res.status(400).json({ message: "Invalid room type. Allowed values are 2 or 4" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newRoom = new Room({
      type,
      players: [{ userId: user._id, username: user.username }],
      status: "waiting",
    });

    await newRoom.save();

    res.status(201).json({
      message: "Room created successfully",
      room: formatRoom(newRoom),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get All Rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().lean();
    res.json({ rooms: rooms.map(formatRoom) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get Room By ID
export const getRoomById = async (req, res) => {
  try {
    const { id: roomId } = req.params;

    const room = await Room.findById(roomId).lean();
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({
      message: "Room details fetched successfully",
      room: formatRoom(room),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getRoomByUserId = async (req, res) => {
  try {
    const userId = req.params;

    if (!userId) {
      res.status(400).json({ message: "userId is required" });
    }
    const room = await Room.findOne({ "players.userId": userId }).lean()
    if (!room) {
      res.status(404).json({ message: "No room found for this user" });
    }
    res.json({
      message: "room fetched successfully by userId",
      room:formatRoom(room),
    });
  }catch(err){
    res.status(500).json({mnessage:"Server error",error:err.message});
  }
}

// ✅ Join Room
export const joinRoom = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const maxPlayers = room.type === 2 ? 2 : 4;

    if (room.players.length >= maxPlayers) {
      return res.status(400).json({ message: "Room is full" });
    }

    if (room.players.some((p) => p.userId.toString() === userId)) {
      return res.status(400).json({ message: "User already in the room" });
    }

    room.players.push({ userId: user._id, username: user.username });
    if (room.players.length === maxPlayers) {
      room.status = "full";
    }

    await room.save();

    res.json({
      message: "Joined room successfully",
      room: formatRoom(room),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Delete Room
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
