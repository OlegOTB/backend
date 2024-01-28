const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { register, login, getUsers } = require("./controllers/user");
const {
  addPost,
  editPost,
  deletePost,
  getPosts,
  getPost,
} = require("./controllers/posts");
const mapUser = require("./helpers/mapUser");
const mapPost = require("./helpers/mapPost");
const authenticated = require("./middlewares/authenticated");

const chalk = require("chalk");
const dbConfig = require("./config/db.config");
const hasRole = require("./middlewares/hasRole");
const ROLES = require("./constants/roles");
const mapComment = require("./helpers/mapComment");
const { deleteComment } = require("./controllers/comment");

const port = 3001;
const app = express();

app.use(cookieParser);
app.use(express.json());

app.post("/register", async (req, res) => {
  try {
    const { user, token } = await register(req.body.login, req.body.password);
    // res.send({error: null, user: mapUser(user)})
    res
      .cookie("token", token, { httpOnly: true })
      .send({ error: null, user: mapUser(user) });
  } catch (e) {
    res.send({ error: e.message || "Unknown error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { user, token } = await login(req.body.login, req.body.password);
    res
      .cookie("token", token, { httpOnly: true })
      .send({ error: null, user: mapUser(user) });
  } catch (e) {
    res.send({ error: e.message || "Unknown error" });
  }
});

app.post("/logout", async (req, res) => {
  res.cookie("token", "", { httpOnly: true }).send();
});

app.get("/posts", async (req, res) => {
  const { posts, lastPage } = await getPosts(
    res.query.search,
    res.query.limit,
    res.query.page
  );

  res.send({ data: { lastPage, posts: posts.map(mapPost) } });
});

app.get("/posts:id", async (req, res) => {
  const post = await getPost(req.param.id);
  res.send({ data: mapPost(post) });
});

app.use(authenticated);

app.post("/posts/:id/comments", async (req, res) => {
  const newComment = await addComment(req.params.id, {
    content: req.body.content,
    author: req.user.id,
  });
  res.send({ data: mapComment(newComment) });
});

app.delete(
  "/posts/:postId/comments/:commentId",
  hasRole([ROLES.ADMIN, ROLES.MODERATOR]),
  async (req, res) => {
    await deleteComment(req.params.postId, req.params.commentId);
    res.send({ error: null });
  }
);

app.post("/posts", hasRole([ROLES.ADMIN]), async (req, res) => {
  const newPost = await addPost({
    title: req.body.title,
    content: req.body.content,
    image: req.body.imageUrl,
  });
  res.send({ data: mapPost(newPost) });
});

app.patch("/posts/:id", hasRole([ROLES.ADMIN]), async (req, res) => {
  const updatePost = await editPost(req.params.id, {
    title: req.body.title,
    content: req.body.content,
    image: req.body.imageUrl,
  });
  res.send({ data: mapPost(updatePost) });
});

app.delete("/posts/:id", hasRole([ROLES.ADMIN]), async (req, res) => {
  const deletePost = await deletePost(req.params.id);
  res.send({ error: null });
});

app.get("/users", hasRole([ROLES.ADMIN]), async (req, res) => {
  const users = await getUsers();
  res.send({ data: users.map(mapUser) });
});

app.get("/users/roles", hasRole([ROLES.ADMIN]), async (req, res) => {
  const roles = getRoles();
  res.send({ data: roles });
});

app.patch("/users/:id", hasRole([ROLES.ADMIN]), async (req, res) => {
  const newUser = await updateUser(req.params.id, { role: req.body.roleId });
  res.send({ data: mapUser(newUser) });
});

app.delete("/users/:id", hasRole([ROLES.ADMIN]), async (req, res) => {
  await deleteUser(req.params.id);
  res.send({ error: null });
});

mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`)
  .then(() => {
    app.listen(port, () => {
      console.log(chalk.blue(`Server has been started on port ${port}...`));
    });
  });
