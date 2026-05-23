const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

dotenv.config();

const app = express();

const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Store io globally
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());

// Static Uploads Folder
app.use(
  "/uploads",
  express.static(path.join(__dirname, "/uploads"))
);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/activities", require("./routes/activityRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));

// Socket Connection
io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("taskChanged", () => {
    io.emit("tasksUpdated");
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected");
  });
});

// Test Route
app.get("/", (req, res) => {
  res.send("Task Manager API Running...");
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// Port
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});