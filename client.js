import { io } from "socket.io-client";
import fetch from "node-fetch";
import readline from "readline";

const SERVER_URL = "http://localhost:5000";

async function startClient() {
  try {
    const res = await fetch(`${SERVER_URL}/api/users`);
    const users = await res.json();

    console.log("\nUsers fetched from server:\n");
    users.forEach((u, i) => console.log(`${i + 1}. ${u.username} (ID: ${u._id})`));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("\nSelect room type (2 or 4 players): ", (typeInput) => {
      const type = parseInt(typeInput);
      rl.question("\nEnter user number to join: ", (num) => {
        const index = parseInt(num) - 1;
        const userId = users[index]._id;
        const username = users[index].username;

        const socket = io(SERVER_URL, { transports: ["websocket"] });

        let currentRoomId = null;
        let currentGameId = null;

        // --- Helper to print board ---
        function printBoard(game) {
          console.log("\n🟢 Game Board:");
          game.players.forEach((p, i) => {
            const tokens = p.tokens.map((t, idx) => `[${idx}:${t.position}]`).join(" ");
            const active = i === game.currentPlayerIndex ? "⬅️" : "";
            console.log(`${p.username} (${p.color}) ${active}: ${tokens} | Score: ${p.score}`);
          });
          if (game.status === "finished") {
            console.log(`🏆 Winner: ${game.winner}`);
          }
        }

        // --- Player turn ---
        async function playerTurn(game) {
          console.log(`\n🟢 Your turn (${username})!`);
          await new Promise((res) => rl.question("Press Enter to roll dice...", res));
          socket.emit("takeTurn", { gameId: currentGameId });
        }

        socket.on("connect", () => {
          console.log(`\n✅ Connected as ${username} (socket ID: ${socket.id})`);
          console.log("👉 Emitting joingame:", { userId, type, username });
          socket.emit("joingame", { userId, type, username });
        });

        socket.on("roomUpdate", (room) => {
          currentRoomId = room.roomId;
          console.log("\n📢 Room update received:", room);

          if (currentRoomId && room.status === "full") {
            // Ask user to leave or start game
            rl.question(
              "\nRoom is full! Do you want to leave this room? (y/n to start game): ",
              (ans) => {
                if (ans.toLowerCase() === "y") {
                  console.log("👉 Emitting leaveroom:", { roomId: currentRoomId, userId });
                  socket.emit("leaveroom", { roomId: currentRoomId, userId });
                } else {
                  console.log("🎮 Starting game...");
                  socket.emit("startGame", { roomId: currentRoomId });
                }
              }
            );
          }
        });

        // --- Game events ---
        socket.on("gameStarted", (game) => {
          currentGameId = game._id;
          console.log("\n🚀 Game started!");
          printBoard(game);

          if (game.players[game.currentPlayerIndex].userId === userId) {
            playerTurn(game);
          } else {
            console.log(`Waiting for ${game.players[game.currentPlayerIndex].username}'s turn...`);
          }
        });

        socket.on("turnTaken", (data) => {
          console.log(
            `\n🎲 ${data.playerId} rolled ${data.dice} and moved token ${data.tokenIndex} from ${data.from} to ${data.to}`
          );
          printBoard(data.game);

          if (data.game.status !== "finished") {
            if (data.game.players[data.game.currentPlayerIndex].userId === userId) {
              playerTurn(data.game);
            } else {
              console.log(`Waiting for ${data.game.players[data.game.currentPlayerIndex].username}'s turn...`);
            }
          }
        });

        socket.on("turnSkipped", (data) => {
          console.log(`\n⏭️ Turn skipped for ${data.playerId}, rolled ${data.dice}`);
          printBoard(data.game);

          if (data.game.players[data.game.currentPlayerIndex].userId === userId) {
            playerTurn(data.game);
          } else {
            console.log(`Waiting for ${data.game.players[data.game.currentPlayerIndex].username}'s turn...`);
          }
        });

        socket.on("leftRoom", (data) => console.log("\n👋 Successfully left room:", data));
        socket.on("roomClosed", (data) => console.log("\n❌ Room closed:", data));
        socket.on("error", (msg) => console.log("\n❌ Error:", msg));
        socket.on("disconnect", () => console.log("❌ Disconnected from server"));
      });
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

startClient();