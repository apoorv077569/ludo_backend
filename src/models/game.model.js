import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  color: String,
  position: { type: Number, default: -1 }, // -1 = base
  isFinished: { type: Boolean, default: false },
});

const playerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  username: String,
  color: String,
  tokens: [tokenSchema],
  order: Number,
  score: { type: Number, default: 0 }, // ✅ score
});

const moveSchema = new mongoose.Schema({
  playerIndex: Number,
  tokenIndex: Number,
  from: Number,
  to: Number,
  roll: Number,
});

const gameSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  players: [playerSchema],
  status: { type: String, enum: ["waiting", "running", "finished"], default: "waiting" },
  currentPlayerIndex: { type: Number, default: 0 },
  lastRoll: { type: Number, default: null },
  moves: [moveSchema],
  boardSize: { type: Number, default: 57 }, // ✅ typical ludo path length
});

const Game = mongoose.model("Game", gameSchema);
export default Game;
