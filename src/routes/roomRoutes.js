import express from "express";
import { createRoom,joinRoom,deleteRoom,getRooms } from "../controllers/roomController.js";

const roomRouter = express.Router();

// create room
roomRouter.post("/create", createRoom);   
roomRouter.get("/",getRooms);          // get all roomsq
roomRouter.put("/join/:id",joinRoom); // join room
roomRouter.delete("/delete/:id",deleteRoom); // delete room
export default roomRouter;