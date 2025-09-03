import Room from "../models/Room.js";
import User from "../models/User.js";

// create room
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
      players: [{ userId: user._id, username: user.username }], // username DB se liya
      status: "waiting",
    });

    await newRoom.save();
    const roomObj = newRoom.toObject();
    roomObj.roomId = roomObj._id; // add roomId field
    delete roomObj._id; // remove _id field
    res.status(201).json({ message: "Room created successfully", room: roomObj });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// get all rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().lean(); // lean() converts to plain JS Objects
    const formattedRooms = rooms.map(room => ({
      roomId: room._id, // add roomId field
      type: room.type,
      players: room.players,
      status: room.status,
      createdAt: room.createdAt,
      __v: room.__v
    }));
    res.json({ rooms: formattedRooms });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// get room by id

// get room details by roomId (not MongoDB _id)
export const getRoomById = async (req, res) => {
  try {
    const { id: roomId } = req.params; // frontend se jo roomId aayega
    const room = await Room.findOne({ roomId }).lean(); // MongoDB me roomId field se search

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // remove _id field, add roomId
    const roomObj = { ...room, roomId: room.roomId };
    delete roomObj._id;

    res.json({ message: "Room details fetched successfully", room: roomObj });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// join room
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
    res.json({ message: "Joined room successfully", room });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};



// Delete room
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};