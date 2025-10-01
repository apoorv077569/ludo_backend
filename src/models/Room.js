import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  type: {
    type: Number,
    required: true, // 2 player or 4 player
    enum: [2, 4],
  },
  players: [
    {
      _id: false,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: String,
    },
  ],
  status: { type: String, enum: ["waiting", "full"], default: "waiting" },
}, { timestamps: true });

// ✅ Convert _id -> roomId automatically in JSON response
roomSchema.method("toJSON", function () {
  const { _id, __v, ...object } = this.toObject();
  object.roomId = _id;
  return object;
});

const Room = mongoose.model("Room", roomSchema, "rooms");
export default Room;