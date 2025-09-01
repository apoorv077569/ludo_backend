import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    unique:true,
    required : true,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  type: {
    type: Number,
    required: true
  }, // 2 player or 4 player
  players: [
    {
      _id: false,
      userId: mongoose.Schema.Types.ObjectId,
      username: String,
    },
  ],
  status: { type: String, default: "Waiting" },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });
const Room = mongoose.model("Room",roomSchema,"rooms");
export default Room;
