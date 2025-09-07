// src/sockets/gameSocket.js
import Room from "../models/Room.js";
import { rollDice } from "../scripts/dice.js";

const gameSocket = (io, socket) => {
  console.log("🔥 Game Socket connected:", socket.id);

  // 🎲 Dice Roll
  socket.on("rollDice", async ({ roomId, userId }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) return socket.emit("error", "Room not found");

      // Validate turn
      const currentPlayer = room.players[room.turnIndex];
      if (currentPlayer.userId.toString() !== userId) {
        return socket.emit("error", "Not your turn");
      }

      // Roll dice
      const diceValue = rollDice();
      io.to(roomId).emit("diceRolled", { userId, dice: diceValue });

    } catch (err) {
      console.error("❌ rollDice error:", err);
      socket.emit("error", "Failed to roll dice");
    }
  });

  // 🏃 Move Token
  socket.on("moveToken", async ({ roomId, userId, tokenIndex, diceValue }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) return socket.emit("error", "Room not found");

      const player = room.players.find(p => p.userId.toString() === userId);
      if (!player) return socket.emit("error", "Player not found");

      // Move token
      player.tokens[tokenIndex] += diceValue;
      if (player.tokens[tokenIndex] > 57) player.tokens[tokenIndex] = 57;

      // Check win
      if (player.tokens.every(pos => pos === 57)) {
        room.status = "finished";
        io.to(roomId).emit("playerWon", { userId });
      }

      // Next turn if dice != 6
      if (diceValue !== 6 && room.status !== "finished") {
        room.turnIndex = (room.turnIndex + 1) % room.players.length;
        io.to(roomId).emit("turnUpdate", {
          currentPlayer: room.players[room.turnIndex].userId
        });
      }

      await room.save();

      // Broadcast updated room
      const formattedRoom = {
        roomId: room._id,
        type: room.type,
        players: room.players.map(p => ({
          userId: p.userId.toString(),
          username: p.username,
          tokens: p.tokens
        })),
        turnIndex: room.turnIndex,
        status: room.status
      };

      io.to(roomId).emit("roomUpdate", formattedRoom);

    } catch (err) {
      console.error("❌ moveToken error:", err);
      socket.emit("error", "Failed to move token");
    }
  });
};

export default ludoSockets;
