import Room from "../models/Room.js";
import User from "../models/User.js";

// ✅ Create Room
export const createRoom = async (req, res) => {
  try {
    const { type, userId } = req.body;
    if (!type || !userId) {
      return res.status(400).json({ message: "type and userId are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newRoom = new Room({
      type, // 2 or 4
      players: [{ userId: user._id, username: user.username }],
      status: "waiting",
    });

    await newRoom.save();

    res.status(201).json({
      message: "Room created successfully",
      room: {
        roomId: newRoom._id, // 👈 ek hi ID use karenge
        type: newRoom.type,
        players: newRoom.players,
        status: newRoom.status,
        createdAt: newRoom.createdAt,
        updatedAt: newRoom.updatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ✅ Get All Rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().lean();

    const formattedRooms = rooms.map(room => ({
      roomId: room._id,
      type: room.type,
      players: room.players,
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));

    res.json({ rooms: formattedRooms });
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

    const roomObj = {
      roomId: room._id,
      type: room.type,
      players: room.players,
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };

    res.json({ message: "Room details fetched successfully", room: roomObj });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

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

    // check if user already exists
    if (room.players.some(p => p.userId.toString() === userId)) {
      return res.status(400).json({ message: "User already in the room" });
    }

    room.players.push({ userId: user._id, username: user.username });
    if (room.players.length === maxPlayers) {
      room.status = "full";
    }

    await room.save();

    res.json({
      message: "Joined room successfully",
      room: {
        roomId: room._id,
        type: room.type,
        players: room.players,
        status: room.status,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      },
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
