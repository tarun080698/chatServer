"use strict";
const WebSocket = require("ws");

var models = require("./server.js").models;

const ws = new WebSocket.Server({ port: 8081 });

ws.on("connection", (ws) => {
  function login(email, password) {
    console.log("in login ___");
    models.User.login({ email: email, password: password }, (err, result) => {
      if (err) {
        console.log("err occured ==> ", err);
        ws.send(
          JSON.stringify({
            type: "ERROR",
            error: err,
          })
        );
      } else {
        console.log("logged in  ==> ", result);
        models.User.findOne(
          { where: { id: result.userId }, include: "Profile" },
          (err2, userData) => {
            if (err2) {
              console.log("err2 occured ==> ", err2);
              ws.send(
                JSON.stringify({
                  type: "ERROR",
                  error: err2,
                })
              );
            } else {
              console.log("found user ==> ", result, userData);
              ws.send(
                JSON.stringify({
                  type: "LOGGEDIN",
                  data: {
                    session: result,
                    user: userData,
                  },
                })
              );
            }
          }
        );
      }
    });
  }
  ws.on("message", (message) => {
    console.log("Got message", JSON.parse(message));
    let parsed = JSON.parse(message);
    if (parsed) {
      switch (parsed.type) {
        case "SIGNUP":
          models.User.create(parsed.data, (err, user) => {
            if (err) {
              ws.send(
                JSON.stringify({
                  type: "ERROR",
                  error: err,
                })
              );
            } else {
              models.Profile.create(
                {
                  userId: user.id,
                  name: parsed.data.name,
                  email: parsed.data.email,
                  date: new Date(),
                },
                (perr, profile) => {
                  if (perr) {
                    console.log(perr);
                  } else {
                    console.log(profile);
                  }
                }
              );
              login(parsed.data.email, parsed.data.password);
            }
          });
          break;
        case "LOGIN":
          console.log(parsed.data.email);
          login(parsed.data.email, parsed.data.password);
          break;
        default:
          console.log("Nothing happened. In default!");
          break;
      }
    }
  });
});
