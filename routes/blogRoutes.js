const express = require("express");
const {
  createBlog,
  getPublishedBlogs,
  getBlog,
  getUserBlogs,
  updateBlog,
  updateBlogState,
  deleteBlog,
} = require("../controllers/blogController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createBlog);
router.get("/", getPublishedBlogs);
router.get("/user/me", protect, getUserBlogs);
router.get("/:id", optionalAuth, getBlog);
router.put("/:id", protect, updateBlog);
router.patch("/:id/state", protect, updateBlogState);
router.delete("/:id", protect, deleteBlog);

module.exports = router;
