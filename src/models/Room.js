import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    type: {
      type: Number,
      required: true,
    }, // 2 player or 4 player
    players: [
      {
        _id: false,
        userId: mongoose.Schema.Types.ObjectId,
        username: String,
      },
    ],
    status: { type: String, default: "waiting" },
  },
  { timestamps: true }
);

// 👇 Auto-update status before save
roomSchema.pre("save", function (next) {
  const maxPlayers = this.type === 2 ? 2 : 4;
  this.status = this.players.length >= maxPlayers ? "full" : "waiting";
  next();
});

const Room = mongoose.model("Room", roomSchema, "rooms");
export default Room;
