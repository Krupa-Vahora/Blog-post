const mongoose = require("mongoose");
const { object } = require("sharp/lib/is");
const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    img: {
      type: object,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        unique: true,
      },
    ],

    comments: [
      {
        type: String,
        optional: true,
      },
    ],
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Topic",
    },
  },
  {
    timestamps: true,
  }
);

postSchema.methods.toJSON = function () {
  const post = this;
  const postObject = post.toObject();

  delete postObject.img;
  return postObject;
};

const Post = mongoose.model("post", postSchema);
module.exports = Post;
