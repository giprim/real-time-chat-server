import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { ChatMessage } from "./types";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow frontend to connect
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const chatRooms: Record<string, ChatMessage[]> = {}; // In-memory storage for chat rooms

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on("joinRoom", ({ room, username }) => {
    socket.join(room);
    chatRooms[room] = chatRooms[room] || [];
    socket.emit("chatHistory", chatRooms[room]); // Send previous messages
    io.to(room).emit("userJoined", { username, id: socket.id });
  });

  // Handle messages
  socket.on("sendMessage", ({ room, username, message }) => {
    const chatMessage = { username, message, timestamp: new Date() };
    chatRooms[room].push(chatMessage);
    io.to(room).emit("receiveMessage", chatMessage);
  });

  // active rooms
  socket.on("requestActiveRooms", () => {
    socket.emit("activeRooms", Object.keys(chatRooms));
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(5100, () => console.log("Server running on port 5100"));
