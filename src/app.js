import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import roomRouter from "./routes/roomRoutes.js";
import gameRoutes from "./routes/game.routes.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/rooms", roomRouter);
app.use("/api/users", userRoutes);
app.use("/api/game", gameRoutes);


export default app; 