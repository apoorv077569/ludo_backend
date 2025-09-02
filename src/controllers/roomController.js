import Room from "../models/Room.js";
import User from "../models/User.js";
import { nanoid } from "nanoid"; 

// Create room
export const createRoom = async (req, res) => {
  try {
    const { type, userId } = req.body;
    if (!type || !userId) {
      return res.status(400).json({ message: "type and userId are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate unique common roomId
    const roomId = nanoid(12);

    const newRoom = new Room({
      roomId, // common roomId
      type,   // 2 or 4
      players: [{ userId: user._id, userName: user.username }],
      status: "waiting",
    });

    await newRoom.save();
    res.status(201).json({ message: "Room created successfully", room: newRoom });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().lean();
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get room by custom roomId
export const getRoomByRoomId = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findOne({ roomId: id }).lean();
    if (!room) return res.status(404).json({ message: "Room not found" });

    res.json({ message: "Room fetched successfully", room });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Join room
export const joinRoom = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;

    const room = await Room.findOne({ roomId: id });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const maxPlayers = room.type === 2 ? 2 : 4;
    if (room.players.length >= maxPlayers) {
      return res.status(400).json({ message: "Room is full" });
    }

    if (room.players.some(p => p.userId.toString() === userId)) {
      return res.status(400).json({ message: "User already in the room" });
    }

    room.players.push({ userId: user._id, userName: user.username });
    if (room.players.length === maxPlayers) room.status = "full";

    await room.save();
    res.json({ message: "Joined room successfully", room });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete room
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findOneAndDelete({ roomId: id });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
