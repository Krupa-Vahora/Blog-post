const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const Topic = require("../model/topic");
const User = require("../model/user");
const Post = require("../model/post");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
//-------User routes-------

//register user
router.post("/users", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

//login user
router.post("/users/login", async (req, res) => {
  const user = await User.findCredentials(req.body.email, req.body.password);
  const token = await user.generateAuthToken();
  res.send({ user, token });
});

//get your profile
router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

//logout user
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

//-------Topic Routes--------

//new topic
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

//get all topics
router.get("/api/allTopic", async (req, res) => {
  try {
    const topic = await Topic.find({});
    res.send(topic);
  } catch (error) {
    res.send("Error:" + error);
  }
});

//-----Post Routes------

//post image validation
// const upload = multer({
//   limits: {
//     fileSize: 10000000,
//   },
//   storage: {
//     destination: function (req, file, cb) {
//       cb(null, "public");
//     },
//     filename: function (req, file, cb) {
//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       cb(null, uniqueSuffix + path.extname(file.originalname));
//     },
//   },
//   fileFilter(req, file, cb) {
//     if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
//       return cb(new Error("please upload an image only"));
//     }
//     cb(undefined, true);
//   },
// });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const filefilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Ivalid file formate"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: filefilter,
  limits: 100000000,
});
//create post
router.post("/post/:topic_id", auth, upload.single("img"), async (req, res) => {
  const topic = req.params.topic_id;
  const post = new Post({
    content: req.body.content,
    img: req.file,
    topic: topic,
  });

  post.save().catch((e) => {
    console.log(e);
  });
  res.status(201).json({
    message: "Post Added Successfully ",
    addPost: post,
    img: req.file,
  });
});

//get all post
router.get("/allPosts", async (req, res) => {
  try {
    const post = await Post.find({});

    res.status(200).send(post);
  } catch (e) {
    res.status(400).send();
  }
});
//edit post
router.patch("/postEdit/:id", auth, upload.single("img"), async (req, res) => {
  try {
    const file = await sharp(req.file)
      .resize({ width: 250, height: 250 })
      .png();

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        content: req.body.content,
        img: file,
      },
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).send();
    }

    res.send(post);
  } catch (e) {
    res.status(400).send(e);
  }
});

//delete post
router.delete("/post/:id", auth, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
    });
    if (!post) {
      return res.status(500).send();
    }
    res.send(post);
  } catch (e) {
    res.status(500).send();
  }
});

//post by topic
router.get("/post/:topic_id", async (req, res) => {
  const topic_id = req.params.topic_id;
  try {
    const post = await Post.find({ topic: topic_id });
    res.status(200).send(post);
  } catch (e) {
    res.status(400).send();
  }
});

// get most recent posts
router.get("/postRecent", auth, async (req, res) => {
  try {
    const recentpost = await Post.find().sort({ _id: -1 }).limit(1);
    res.send(recentpost);
  } catch (e) {
    res.status(500).send(e);
  }
});

//like post
router.patch("/postLike/:id", auth, async (req, res) => {
  try {
    const postData = await Post.findById(req.params.id);
    if (postData.likes.includes(req.user._id)) {
      return res.send({ message: "You liked it already!!" });
    }

    const post = await Post.findByIdAndUpdate(
      { _id: req.params.id },
      {
        $push: {
          likes: req.user._id,
        },
      },
      {
        new: true,
      }
    ).exec((error, result) => {
      if (error) {
        return res.status(404).send();
      } else {
        res.status(200).send(result);
      }
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

//dislike post

router.patch("/postDislike/:id", auth, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      { _id: req.params.id },
      {
        $pull: { likes: req.user._id },
      },
      {
        new: true,
      }
    ).exec((error, result) => {
      if (error) {
        return res.status(404).send();
      } else {
        res.send(result);
      }
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

//get most liked post
router.get("/postMostLike", async (req, res) => {
  try {
    //  const post = await Post.find({ likes: { $size:  } });

    const post = await Post.aggregate([
      {
        $addFields: {
          totalLikes: {
            $size: "$likes",
          },
        },
      },
      {
        $sort: {
          totalLikes: -1,
        },
      },
      {
        $project: {
          img: 0,
        },
      },
      // { $limit: 5 },
    ]);
    res.status(200).send(post);
    const postSort = post.sort((a, b) => {
      return b.likes - a.likes;
    });

    console.log("Content : ", postSort[0].content);
    console.log("Likes ", postSort[0].likes);
  } catch (e) {
    res.status(400).send();
  }
});

//comment on post
router.patch("/postComment/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const comments = post.comments;
    comments.push(req.body.comments);
    post.comments = comments;
    await post.save();
    res.send(post);
  } catch (e) {
    res.status(400).send(e);
  }
});
module.exports = router;
