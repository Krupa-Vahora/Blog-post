const mongoose = require("mongoose");
const Topic = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});
const model = mongoose.model("Topic", Topic);
module.exports = model;
