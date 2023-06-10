// peer_server
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { ExpressPeerServer } from "peer";
import http from "http";

const app = express();
const httpApp = http.createServer(app);

app.use("/peerjs", ExpressPeerServer(httpApp, { debug: true }));

const port = process.env.PORT || 3003;
httpApp.listen(port, (err) => {
  if (err) {
    console.log("Error!! ", err);
    return;
  }
  console.log("listen on port " + port);
});
