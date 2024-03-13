import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import { generateRoomCode } from "./components/RoomCodeGenerator.js";
import { checkValidMove, createPuzzle } from "./components/PuzzleManager.js";
import { generateBoard } from "./components/BoardManager.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
  },
  connectionStateRecovery: {
    // the backup duration of the sessions and the packets
    maxDisconnectionDuration: 2 * 60 * 1000,
    // whether to skip middlewares upon successful recovery
    skipMiddlewares: true,
  },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
let users = {};
let rooms = {};

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.get("/users", (req, res) => {
  res.send(users);
});

app.get("/rooms", (req, res) => {
  res.send(rooms);
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("disconnect", () => {
    console.log("user disconnected");
    const room = users[socket.id];
    if (!rooms[room]) return;
    const index = rooms[room].players.indexOf(socket.id);
    rooms[room].players.splice(index, 1);
    delete users[socket.id];
    if (rooms[room].players.length === 0) delete rooms[room];
  });

  socket.on("chat message", (msg) => {
    if (users[socket.id]) {
      console.log("chat message", msg);
      io.to(users[socket.id]).emit("chat message", msg);
    } else {
      socket.emit("chat message", "You need to join a room first");
    }
  });

  socket.on("room connect", (room) => {
    if (!rooms[room]) {
      socket.emit("chat message", "Room not found");
      return;
    }
    console.log("room connected", socket.id, room);
    socket.join(room);
    users[socket.id] = room;
    rooms[room].players.push(socket.id);
    socket.emit("room joined", room);

    io.to(room).emit(
      "user connected",
      `${socket.id} connected to room ${room}`
    );

    socket.emit("game joined", rooms[room].board);
  });

  socket.on("room create", () => {
    if (users[socket.id]) {
      socket.emit("chat message", "Already in a room");
      return;
    }
    let room = generateRoomCode();
    while (rooms[room]) {
      room = generateRoomCode();
    }
    console.log("creating room", socket.id, room);
    rooms[room] = {};
    rooms[room].players = [socket.id];
    socket.join(room);
    users[socket.id] = room;

    socket.emit("room joined", room);

    let puzzle = createPuzzle();
    let board = generateBoard(puzzle);
    rooms[room].puzzle = puzzle;
    rooms[room].board = board;

    socket.emit("game joined", board);
  });

  socket.on("game move selected", (move) => {
    console.log("Game moved", move);
    const { x, y, value } = move;
    const room = users[socket.id];
    if (rooms[room].board[y][x].prefilled) {
      socket.emit("chat message", "Not a valid move");
      return;
    }
    if (rooms[room].board[y][x].value === value) {
      return;
    }
    let puzzle = rooms[room].puzzle;
    const valid = checkValidMove(puzzle, move);
    rooms[room].board[y][x].value = value;
    rooms[room].board[y][x].valid = valid;
    io.to(room).emit("game move updated", { ...move, valid: valid });
  });

  socket.on("game move erased", (move) => {
    console.log("Game moved", move);
    const { x, y, value } = move;
    const room = users[socket.id];
    if (rooms[room].board[y][x].prefilled) {
      socket.emit("chat message", "Not a valid move");
      return;
    }

    rooms[room].board[y][x].value = "";
    io.to(room).emit("game move erased", move);
  });

  socket.on("game new", () => {
    console.log("creating new game");
    const room = users[socket.id];

    let puzzle = createPuzzle();
    let board = generateBoard(puzzle);
    rooms[room].puzzle = puzzle;
    rooms[room].board = board;

    io.to(room).emit("game new", board);
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
