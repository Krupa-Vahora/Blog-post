const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const Topic = require("../model/topic");

router.get("/api/allTopic", async (req, res) => {
  try {
    const topic = await Topic.find({});
    console.log(topic);
    res.send(topic);
  } catch (error) {
    res.send("Error:" + error);
  }
});
router.post("/api/createTopic", (req, res) => {
  const topic = new Topic({
    name: req.body.name,
  });
  topic.save((err, data) => {
    res.status(200).json({
      code: 200,
      message: "Topic Added Successfully ",
      addTopic: data,
    });
  });
});
module.exports = router;
