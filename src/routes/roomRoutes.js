import express from "express";
import { createRoom,joinRoom,deleteRoom,getRooms,getRoomById } from "../controllers/roomController.js";

const roomRouter = express.Router();

// create room
roomRouter.post("/create", createRoom);   
roomRouter.get("/",getRooms);          // get all roomsq
roomRouter.put("/join/:id",joinRoom); // join room
roomRouter.delete("/delete/:id",deleteRoom); // delete room
roomRouter.get("/:id", getRoomById); // get room by id

export default roomRouter;