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

        const socket = io(SERVER_URL, { transports: ["websocket"] });

        socket.on("connect", () => {
          console.log(`\n✅ Connected as ${users[index].username} (socket ID: ${socket.id})`);
          console.log("👉 Emitting joingame:", { userId, type });
          socket.emit("joingame", { userId, type });
        });

        socket.on("waiting", (msg) => console.log("⏳ Waiting:", msg.message));

        socket.on("roomUpdate", (room) => {
          console.log("\n📢 Room update received:", room);
        });

        socket.on("error", (msg) => console.log("\n❌ Error:", msg));

        socket.on("disconnect", () => console.log("❌ Disconnected from server"));

        rl.close();
      });
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

startClient();
