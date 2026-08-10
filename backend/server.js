const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

let players = {};
let gameStarted = false;
let calledNumbers = [];
let callTimer;

io.on("connection", (socket) => {

  console.log("Player connected:", socket.id);

  socket.on("joinGame", (playerData) => {

    players[socket.id] = {
      id: socket.id,
      name: playerData.name,
      boardNumber: null
    };

    io.emit("playerUpdate", {
      players: Object.values(players)
    });

  });

  socket.on("selectBoard", (boardNumber) => {

    const boardTaken = Object.values(players)
      .some(player => player.boardNumber === boardNumber);

    if (boardTaken) {

      socket.emit("boardError", {
        message: "This number is already taken."
      });

      return;
    }

    players[socket.id].boardNumber = boardNumber;

    io.emit("playerUpdate", {
      players: Object.values(players)
    });

  });

  socket.on("startGame", () => {

    if (gameStarted) return;

    gameStarted = true;

    io.emit("gameStarted");

    startNumberCalling();

  });

  socket.on("disconnect", () => {

    delete players[socket.id];

    io.emit("playerUpdate", {
      players: Object.values(players)
    });

  });

});

function startNumberCalling() {

  callTimer = setInterval(() => {

    if (calledNumbers.length >= 75) {

      clearInterval(callTimer);

      io.emit("gameFinished");

      return;
    }

    let number;

    do {

      number =
        Math.floor(Math.random() * 75) + 1;

    } while (calledNumbers.includes(number));

    calledNumbers.push(number);

    io.emit("numberCalled", {
      number: number,
      calledNumbers: calledNumbers
    });

  }, 3000);

}

server.listen(PORT, () => {

  console.log(`Bingo server running on port ${PORT}`);

});