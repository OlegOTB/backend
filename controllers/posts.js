const Post = require("../models/Post");

//add
async function addPost(post) {
  const newPost = await Post.create(post);
  await newPost.populate({
    path: "comments",
    populate: "author",
  });
  return newPost;
}

//edit
async function editPost(id, post) {
  const newPost = await Post.findByIdAndUpdate(id, post, {
    returnDocument: "after",
  });
  await newPost.populate({
    path: "comments",
    populate: "author",
  });
  return newPost;
}

//delete
function deletePost(id) {
  return Post.deleteOne({ _id: id });
}

//get kist with pagination and search
async function getPosts(search = "", limit = 10, page = 1) {
  const [post, count] = await Promise.all([
    Post.find({ title: { $regex: search, $options: "i" } })
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 }),
    Post.countDocuments({ title: { $regex: search, $options: "i" } }),
  ]);
  return { post, lastPage: Math.ceil(count / limit) };
}

//get item
function getPost(id) {
  return Post.findById(id).populate({
    path: "comments",
    populate: "author",
  });
}

module.exports = {
  addPost,
  editPost,
  deletePost,
  getPosts,
  getPost,
};
