const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const url = "mongodb://localhost/BlogDB";

const app = express();

//connection
mongoose.connect(url, { useNewUrlParser: true });
const con = mongoose.connection;

con.on("open", () => {
  console.log("Connected");
});

//routes
app.use(bodyParser.json());
const blogRoute = require("./route/index");
app.use(blogRoute);

//listen
app.listen(3000, () => {
  console.log("Server Started");
});
