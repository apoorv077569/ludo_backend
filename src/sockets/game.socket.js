// src/sockets/gameSocket.js
import Game from "../models/game.model.js";
import Room from "../models/Room.js";

const PLAYER_COLORS = ["red", "blue", "green", "yellow"];
const SAFE_POSITIONS = [1, 9, 14, 22, 27, 35, 40, 48]; // safe spots

export default function gameSocket(io, socket) {
  console.log("Game socket ready for:", socket.id);

  // Start game: assign colors, tokens
  socket.on("startGame", async ({ roomId }) => {
    const room = await Room.findById(roomId);
    if (!room) return;

    // Create game document
    const gamePlayers = room.players.map((p, index) => ({
      userId: p.userId,
      username: p.username,
      color: PLAYER_COLORS[index],
      tokens: [
        { color: PLAYER_COLORS[index], position: -1 },
        { color: PLAYER_COLORS[index], position: -1 },
        { color: PLAYER_COLORS[index], position: -1 },
        { color: PLAYER_COLORS[index], position: -1 },
      ],
      order: index,
      score: 0,
    }));

    const game = await Game.create({
      roomId,
      players: gamePlayers,
      status: "running",
      currentPlayerIndex: 0,
    });

    room.status = "full";
    await room.save();

    io.to(roomId).emit("gameStarted", game);
  });

  // Take turn: roll dice and move token
  socket.on("takeTurn", async ({ gameId }) => {
    const game = await Game.findById(gameId);
    if (!game || game.status !== "running") return;

    const currentPlayer = game.players[game.currentPlayerIndex];
    const dice = Math.floor(Math.random() * 6) + 1;

    // Find first movable token
    let tokenIndex = currentPlayer.tokens.findIndex(
      (t) => !t.isFinished && (t.position !== -1 || dice === 6)
    );

    if (tokenIndex === -1) {
      // No token can move, skip turn
      if (dice !== 6) {
        game.currentPlayerIndex =
          (game.currentPlayerIndex + 1) % game.players.length;
      }
      await game.save();
      return io.to(game.roomId.toString()).emit("turnSkipped", {
        playerId: currentPlayer.userId,
        dice,
        game,
      });
    }

    const token = currentPlayer.tokens[tokenIndex];
    const from = token.position;

    // Move token
    if (token.position === -1 && dice === 6) token.position = 0;
    else token.position += dice;

    if (token.position >= game.boardSize) {
      token.position = game.boardSize;
      token.isFinished = true;
      currentPlayer.score += 1;
    }

    // Check killing opponent tokens
    game.players.forEach((p, pi) => {
      if (pi === game.currentPlayerIndex) return;
      p.tokens.forEach((t) => {
        if (t.position === token.position && !SAFE_POSITIONS.includes(t.position)) {
          t.position = -1;
        }
      });
    });

    // Save move
    game.moves.push({
      playerIndex: game.currentPlayerIndex,
      tokenIndex,
      from,
      to: token.position,
      roll: dice,
    });

    // Decide next turn
    if (dice !== 6) {
      game.currentPlayerIndex =
        (game.currentPlayerIndex + 1) % game.players.length;
    }

    // Check winner
    const finishedPlayers = game.players.filter(
      (p) => p.score === 4
    );
    if (finishedPlayers.length > 0) {
      game.status = "finished";
      game.winner = finishedPlayers[0].userId;
    }

    await game.save();

    io.to(game.roomId.toString()).emit("turnTaken", {
      playerId: currentPlayer.userId,
      dice,
      tokenIndex,
      from,
      to: token.position,
      game,
    });
  });
}
