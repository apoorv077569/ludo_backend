import express from "express";
import { createRoom, joinRoom, deleteRoom, getRooms, getRoomById, getRoomByUserId,leaveRoom } from "../controllers/roomController.js";

const roomRouter = express.Router();

// create room
roomRouter.post("/create", createRoom);
roomRouter.get("/", getRooms);          // get all roomsq
roomRouter.put("/join/:id", joinRoom); // join room
roomRouter.delete("/delete/:id", deleteRoom); // delete room
roomRouter.get("/:id", getRoomById);
roomRouter.get("/user/:userId", getRoomByUserId);
roomRouter.post("/:id/leave",leaveRoom);

export default roomRouter;