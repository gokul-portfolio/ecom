/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const { Server } = require("socket.io");

const PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
const httpServer = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "healthy", service: "socket.io-gateway", port: PORT }));
});

const io = new Server(httpServer, {
  path: "/api/socket/io",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

let connectedUsers = 0;

io.on("connection", (socket) => {
  connectedUsers++;
  console.log(`[Standalone Socket] Client connected: ${socket.id} (Total: ${connectedUsers})`);

  io.emit("users:count", connectedUsers);
  socket.join("admin:general");

  socket.on("join:room", (room) => socket.join(room));
  socket.on("leave:room", (room) => socket.leave(room));

  socket.on("client:ping", (data, cb) => {
    if (typeof cb === "function") cb({ pong: true });
    socket.emit("system:ping", { timestamp: Date.now() });
  });

  socket.on("orders:create_test", (data) => {
    const orderId = `ORD-${Date.now().toString().slice(-4)}`;
    io.to("admin:general").emit("orders:new", {
      orderId,
      customerName: data?.customerName || "Sneha Patel",
      amount: data?.amount || 4999,
      itemsCount: 2,
    });
  });

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
    io.emit("users:count", connectedUsers);
  });
});

httpServer.listen(PORT, () => {
  console.log(`> Standalone Socket.io Gateway running on port ${PORT}`);
});
