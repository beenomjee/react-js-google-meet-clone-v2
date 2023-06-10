// peer_server
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import express from "express";
import { ExpressPeerServer } from "peer";
import http from "http";

const app = express();
const httpApp = http.createServer(app);

app.use(express.static("public"));
app.use("/peerjs", ExpressPeerServer(httpApp, { debug: true }));

app.get("*", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

const port = process.env.PORT || 3003;
httpApp.listen(port, (err) => {
  if (err) {
    console.log("Error!! ", err);
    return;
  }
  console.log("listen on port " + port);
});
