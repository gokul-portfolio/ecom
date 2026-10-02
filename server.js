/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling request:", err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Attach Socket.io Server to the same HTTP server
  const io = new Server(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  let connectedUsers = 0;

  io.on("connection", (socket) => {
    connectedUsers++;
    console.log(`[Socket.io] Client connected: ${socket.id} (Active: ${connectedUsers})`);

    // Broadcast active users count to all clients
    io.emit("users:count", connectedUsers);
    socket.join("admin:general");

    // Room subscription
    socket.on("join:room", (room) => {
      socket.join(room);
    });

    socket.on("leave:room", (room) => {
      socket.leave(room);
    });

    // Heartbeat ping
    socket.on("client:ping", (data, cb) => {
      if (typeof cb === "function") cb({ pong: true });
      socket.emit("system:ping", { timestamp: Date.now() });
    });

    // Test real-time order broadcast
    socket.on("orders:create_test", (data) => {
      const orderId = `ORD-${Date.now().toString().slice(-4)}`;
      io.to("admin:general").emit("orders:new", {
        orderId,
        customerName: data?.customerName || "Sneha Patel",
        amount: data?.amount || 4999,
        itemsCount: 2,
      });
    });

    // Test notification broadcast
    socket.on("notifications:send_test", (data) => {
      io.to("admin:general").emit("notifications:broadcast", {
        id: `notif-${Date.now()}`,
        title: data?.title || "Real-Time Update",
        message: data?.message || "Socket.io broadcast received successfully!",
        type: data?.type || "info",
        timestamp: new Date().toLocaleTimeString(),
      });
    });

    socket.on("disconnect", () => {
      connectedUsers = Math.max(0, connectedUsers - 1);
      console.log(`[Socket.io] Client disconnected: ${socket.id} (Active: ${connectedUsers})`);
      io.emit("users:count", connectedUsers);
    });
  });

  // Store global reference
  global.ioInstance = io;

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.io listening on path /api/socket/io`);
  });
});
