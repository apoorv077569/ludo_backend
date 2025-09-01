import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    balance: { type: Number, default: 0 }
}, { timestamps: true });
const User = mongoose.model("User", userSchema, "users");
export default User;