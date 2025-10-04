const Blog = require("../models/Blog");
const User = require("../models/User");

// @desc    Create a new blog
// @route   POST /api/blogs
// @access  Private
exports.createBlog = async (req, res, next) => {
  try {
    const { title, description, tags, body } = req.body;

    const blog = await Blog.create({
      title,
      description,
      tags,
      body,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
exports.getPublishedBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Search filters
    const query = { state: "published" };

    if (req.query.author) {
      const author = await User.findOne({
        $or: [
          { first_name: new RegExp(req.query.author, "i") },
          { last_name: new RegExp(req.query.author, "i") },
        ],
      });
      if (author) {
        query.author = author._id;
      }
    }

    if (req.query.title) {
      query.title = new RegExp(req.query.title, "i");
    }

    if (req.query.tags) {
      query.tags = { $in: req.query.tags.split(",") };
    }

    // Sort options
    let sortOption = {};
    if (req.query.order_by) {
      const validSortFields = ["read_count", "reading_time", "createdAt"];
      if (validSortFields.includes(req.query.order_by)) {
        sortOption[req.query.order_by] = -1;
      }
    } else {
      sortOption.createdAt = -1;
    }

    const blogs = await Blog.find(query)
      .populate("author", "first_name last_name email")
      .sort(sortOption)
      .limit(limit)
      .skip(skip);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single published blog
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "author",
      "first_name last_name email"
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    if (blog.state !== "published") {
      // Only owner can view draft blogs
      if (!req.user || blog.author._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    // Increment read count
    blog.read_count += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's blogs
// @route   GET /api/blogs/user/me
// @access  Private
exports.getUserBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { author: req.user._id };

    // Filter by state
    if (req.query.state) {
      query.state = req.query.state;
    }

    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private
exports.updateBlog = async (req, res, next) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Check ownership
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this blog",
      });
    }

    blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update blog state
// @route   PATCH /api/blogs/:id/state
// @access  Private
exports.updateBlogState = async (req, res, next) => {
  try {
    const { state } = req.body;

    if (!["draft", "published"].includes(state)) {
      return res.status(400).json({
        success: false,
        message: "Invalid state. Must be either draft or published",
      });
    }

    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Check ownership
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this blog",
      });
    }

    blog.state = state;
    await blog.save();

    res.status(200).json({
      success: true,
      message: `Blog ${state} successfully`,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Check ownership
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this blog",
      });
    }

    await blog.deleteOne();

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
