import app from "./app.js";
import { connect } from "./db/index.js";
import { Server } from "socket.io";
import http from "http";

const httpApp = http.createServer(app);

const io = new Server(httpApp, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

const allRoomInformation = {};

io.on("connection", (socket) => {
  // joining existing room
  socket.on("isRoomExist:request", ({ roomId }) => {
    if (allRoomInformation[roomId]) {
      socket.emit("isRoomExist:fullfilled");
      // for later use
      socket.roomId = roomId;
      socket.join(roomId);
    } else {
      socket.emit("isRoomExist:rejected");
    }
  });

  // creating new room
  socket.on("createRoom:request", ({ roomId }) => {
    if (!allRoomInformation[roomId]) {
      allRoomInformation[roomId] = {};
      allRoomInformation[roomId].users = {};
      socket.emit("createRoom:fullfilled");
      // for later use
      socket.roomId = roomId;
      socket.join(roomId);
    } else {
      socket.emit("createRoom:rejected");
    }
  });

  // get user data of the joined room and save his own information
  socket.on("roomData:request", ({ roomId, userInfo }) => {
    const roomInformation = allRoomInformation[roomId];
    if (roomInformation) {
      const connectedUsers = roomInformation.users;
      roomInformation.users = { ...connectedUsers, [socket.id]: userInfo };
      socket.broadcast
        .to(roomId)
        .emit("newUser:joined", { socketId: socket.id, userInfo });
      socket.emit("roomData:fulfilled", { connectedUsers });
    } else {
      socket.emit("roomData:rejected");
    }
  });

  // on video toggle
  socket.on("toggleVideo:request", () => {
    const roomInformation = allRoomInformation[socket.roomId];
    if (roomInformation) {
      roomInformation.users[socket.id].isVideoOn =
        !roomInformation.users[socket.id].isVideoOn;
      io.to(socket.roomId).emit("toggleVideo:fulfilled", {
        fromSocketId: socket.id,
        isVideoOn: roomInformation.users[socket.id].isVideoOn,
      });
    } else {
      socket.emit("toggleVideo:rejected");
    }
  });

  // on Audio toggle
  socket.on("toggleAudio:request", () => {
    const roomInformation = allRoomInformation[socket.roomId];
    if (roomInformation) {
      roomInformation.users[socket.id].isMicOn =
        !roomInformation.users[socket.id].isMicOn;
      io.to(socket.roomId).emit("toggleAudio:fulfilled", {
        fromSocketId: socket.id,
        isMicOn: roomInformation.users[socket.id].isMicOn,
      });
    } else {
      socket.emit("toggleAudio:rejected");
    }
  });

  // on Screen sharing toggle
  socket.on("toggleScreenSharing:request", () => {
    const roomInformation = allRoomInformation[socket.roomId];
    if (roomInformation) {
      roomInformation.users[socket.id].isScreenSharing =
        !roomInformation.users[socket.id].isScreenSharing;
      socket.emit("toggleScreenSharing:fulfilled", {
        fromSocketId: socket.id,
        isScreenSharing: roomInformation.users[socket.id].isScreenSharing,
      });
    } else {
      socket.emit("toggleScreenSharing:rejected");
    }
  });

  // on message
  socket.on("message", ({ message, name }) => {
    io.to(socket.roomId).emit("message", {
      name,
      message,
      socketId: socket.id,
    });
  });

  // on socket disconnect
  socket.on("disconnect", () => {
    const roomInformation = allRoomInformation[socket.roomId];
    if (roomInformation && roomInformation.users) {
      delete roomInformation.users[socket.id];
      socket.broadcast
        .to(socket.roomId)
        .emit("user:leave", { socketId: socket.id });

      if (Object.keys(roomInformation.users).length === 0) {
        delete allRoomInformation[socket.roomId];
      }
    }
  });
});

// port
const port = process.env.PORT || 3000;
httpApp.listen(port, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`Server listening on ${port}`);
  connect();
});
