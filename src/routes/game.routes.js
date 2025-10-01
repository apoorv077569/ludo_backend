import express from "express";
import {
  startGame,
  rollDice,
  moveToken,
  getGameState
} from "../controllers/game.controller.js";

const router = express.Router();

// Start game for a room
router.post("/:roomId/start", startGame);

// Roll dice for current player
router.post("/:gameId/roll", rollDice);

// Move token for current player
router.post("/:gameId/move", moveToken);

// Get full game state
router.get("/:gameId", getGameState);

export default router;