const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    state: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    read_count: {
      type: Number,
      default: 0,
    },
    reading_time: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    body: {
      type: String,
      required: [true, "Body is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Calculate reading time before saving
blogSchema.pre("save", function (next) {
  if (this.isModified("body")) {
    const wordsPerMinute = 200;
    const wordCount = this.body.trim().split(/\s+/).length;
    this.reading_time = Math.ceil(wordCount / wordsPerMinute);
  }
  next();
});

// Index for search optimization
blogSchema.index({ title: "text", tags: "text" });
blogSchema.index({ state: 1, createdAt: -1 });

module.exports = mongoose.model("Blog", blogSchema);
