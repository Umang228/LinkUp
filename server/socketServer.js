const jwt = require("jsonwebtoken");

let users = [];

const authSocket = (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication error: Token missing"));
  }

  try {
    // Verify JWT token and attach decoded payload to the socket
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    socket.decoded = decoded;
    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);
    next(new Error("Authentication error: Invalid token"));
  }
};

const socketServer = (socket) => {
  const userId = socket.decoded.userId;

  // Add user to the list of connected users
  users.push({ userId, socketId: socket.id });
  console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);
  console.log("Connected users:", users);

  // Handle sending messages
  socket.on("send-message", (recipientUserId, username, content) => {
    const recipient = users.find((user) => user.userId === recipientUserId);

    if (recipient) {
      console.log(`Message from ${userId} to ${recipientUserId}: ${content}`);
      socket
        .to(recipient.socketId)
        .emit("receive-message", { senderId: userId, username, content });
    } else {
      console.log(`Recipient ${recipientUserId} not connected.`);
    }
  });

  // Handle user disconnecting
  socket.on("disconnect", () => {
    users = users.filter((user) => user.userId !== userId);
    console.log(`User disconnected: ${userId}`);
    console.log("Connected users after disconnect:", users);
  });
};

module.exports = { socketServer, authSocket };
