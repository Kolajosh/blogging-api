const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Blogging API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      blogs: "/api/blogs",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/blogs", blogRoutes);

// Error handler
app.use(errorHandler);

module.exports = app;
