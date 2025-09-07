import express from "express";
import { rollDiceController } from "../controllers/ludogame.controller";

const ludoRouter = express.Router();

ludoRouter.get("/roll-dice",rollDiceController);

export default ludoRouter;

