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

        socket.on("connect", () => {
          console.log(`\n✅ Connected as ${username} (socket ID: ${socket.id})`);
          console.log("👉 Emitting joingame:", { userId, type, username });
          socket.emit("joingame", { userId, type, username });
        });

        socket.on("roomUpdate", (room) => {
          currentRoomId = room.roomId;
          console.log("\n📢 Room update received:", room);

          // Prompt user for leave option once inside a room
          if (currentRoomId) {
            rl.question("\nDo you want to leave this room? (y/n): ", (ans) => {
              if (ans.toLowerCase() === "y") {
                console.log("👉 Emitting leaveroom:", { roomId: currentRoomId, userId });
                socket.emit("leaveroom", { roomId: currentRoomId, userId });
              }
            });
          }
        });

        socket.on("leftRoom", (data) => {
          console.log("\n👋 Successfully left room:", data);
        });

        socket.on("roomClosed", (data) => {
          console.log("\n❌ Room closed:", data);
        });

        socket.on("error", (msg) => console.log("\n❌ Error:", msg));
        socket.on("disconnect", () => console.log("❌ Disconnected from server"));
      });
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

startClient();
