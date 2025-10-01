import Game from "../models/game.model.js";
import Room from "../models/Room.js";

/** Start a new game from a room */
export async function startGame(req, res) {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });
    if (room.status !== "full") return res.status(400).json({ message: "Room is not full yet" });

    const existingGame = await Game.findOne({ roomId });
    if (existingGame) return res.status(400).json({ message: "Game already started" });

    const colors = ["red", "blue", "green", "yellow"];
    const players = room.players.map((p, index) => ({
      userId: p.userId,
      username: p.username,
      color: colors[index],
      tokens: Array.from({ length: 4 }, () => ({ color: colors[index], position: -1, isFinished: false })),
      order: index,
      score: 0,
    }));

    const game = new Game({
      roomId: room._id,
      players,
      status: "running",
      currentPlayerIndex: 0,
      lastRoll: null,
      moves: [],
    });

    await game.save();
    room.status = "full";
    await room.save();

    return res.status(201).json({
      gameId: game._id, // ✅ include gameId
      game,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error starting game", error: err.message });
  }
}

/** Roll dice for current player */
export async function rollDice(req, res) {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });
    if (game.status !== "running") return res.status(400).json({ message: "Game is not running" });

    const roll = Math.floor(Math.random() * 6) + 1;
    game.lastRoll = roll;
    await game.save();

    return res.json({
      gameId: game._id, // ✅ include gameId
      roll,
      currentPlayerIndex: game.currentPlayerIndex,
      game,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error rolling dice", error: err.message });
  }
}

/** Move token for current player */
export async function moveToken(req, res) {
  try {
    const { gameId } = req.params;
    const { tokenIndex } = req.body;

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });
    if (game.status !== "running") return res.status(400).json({ message: "Game is not running" });

    const player = game.players[game.currentPlayerIndex];
    if (!player) return res.status(400).json({ message: "Invalid player" });

    const roll = game.lastRoll;
    if (roll == null) return res.status(400).json({ message: "Roll dice first" });

    const token = player.tokens[tokenIndex];
    if (!token) return res.status(400).json({ message: "Invalid token index" });

    let from = token.position;
    let to;

    // Unlock token from base
    if (from === -1 && roll === 6) {
      to = 0;
      token.position = to;
      player.score += 1; // ✅ reward for unlocking
    } else if (from === -1) {
      return res.status(400).json({ message: "Token is in base, need 6 to move" });
    } else {
      to = from + roll;
      if (to >= game.boardSize) {
        token.isFinished = true;
        token.position = 999 + tokenIndex;
        to = token.position;
        player.score += 10; // ✅ finishing reward
      } else {
        token.position = to;
        player.score += roll; // ✅ normal move reward
      }
    }

    // ✅ Capture opponent tokens
    if (!token.isFinished && token.position >= 0) {
      game.players.forEach((op, pIndex) => {
        if (pIndex !== game.currentPlayerIndex) {
          op.tokens.forEach(tk => {
            if (!tk.isFinished && tk.position === token.position) {
              tk.position = -1; // send back to base
              player.score += 5; // ✅ capture reward
            }
          });
        }
      });
    }

    // Save move
    game.moves.push({ playerIndex: game.currentPlayerIndex, tokenIndex, from, to, roll });
    game.lastRoll = null;

    // Advance turn if not a 6
    if (roll !== 6) {
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    }

    // Check if player has won
    const finished = player.tokens.every(t => t.isFinished);
    if (finished) {
      game.status = "finished";
    }

    await game.save();
    return res.json({
      gameId: game._id, // ✅ include gameId
      moved: { playerIndex: game.currentPlayerIndex, tokenIndex, from, to },
      game,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error moving token", error: err.message });
  }
}

/** Get current game state */
export async function getGameState(req, res) {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    return res.json({
      gameId: game._id, // ✅ include gameId
      game,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching game", error: err.message });
  }
}
