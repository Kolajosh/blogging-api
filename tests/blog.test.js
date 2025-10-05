const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const User = require("../models/User");
const Blog = require("../models/Blog");

describe("Blog Tests", () => {
  let authToken;
  let userId;
  let secondToken;
  let blogId;

  beforeAll(async () => {
    await mongoose.connect(
      process.env.MONGODB_URI_TEST ||
        "mongodb://localhost:27017/blog_altschool-test"
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Blog.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Blog.deleteMany({});

    // Create first user
    const signupResponse = await request(app).post("/api/auth/signup").send({
      first_name: "Test",
      last_name: "User",
      email: "test@test.com",
      password: "password123",
    });

    authToken = signupResponse.body.data.token;
    userId = signupResponse.body.data.user.id;

    // Create second user
    const secondUser = await request(app).post("/api/auth/signup").send({
      first_name: "Second",
      last_name: "User",
      email: "second@test.com",
      password: "password123",
    });

    secondToken = secondUser.body.data.token;
  });

  describe("POST /api/blogs", () => {
    it("should create a blog successfully", async () => {
      const blogData = {
        title: "My First Blog Post",
        description: "This is a test blog",
        tags: ["test", "nodejs"],
        body: "This is the body of my first blog post. It contains some interesting content about testing.",
      };

      const response = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send(blogData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("title", blogData.title);
      expect(response.body.data).toHaveProperty("state", "draft");
      expect(response.body.data).toHaveProperty("read_count", 0);
      expect(response.body.data).toHaveProperty("reading_time");
      expect(response.body.data.reading_time).toBeGreaterThan(0);

      blogId = response.body.data._id;
    });

    it("should fail without authentication", async () => {
      const blogData = {
        title: "Unauthorized Blog",
        body: "This should fail",
      };

      const response = await request(app)
        .post("/api/blogs")
        .send(blogData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should fail without required fields", async () => {
      const response = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Only Title" })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should calculate reading time correctly", async () => {
      const longBody = "word ".repeat(400); // 400 words
      const blogData = {
        title: "Long Blog Post",
        body: longBody,
      };

      const response = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send(blogData)
        .expect(201);

      expect(response.body.data.reading_time).toBe(2); // 400 words / 200 WPM = 2 minutes
    });
  });

  describe("GET /api/blogs", () => {
    beforeEach(async () => {
      // Create published blog
      await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Published Blog",
          body: "This is a published blog",
          tags: ["published"],
        });

      const blogs = await Blog.find({});
      await Blog.findByIdAndUpdate(blogs[0]._id, { state: "published" });

      // Create draft blog
      await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Draft Blog",
          body: "This is a draft blog",
        });
    });

    it("should get published blogs without authentication", async () => {
      const response = await request(app).get("/api/blogs").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].state).toBe("published");
    });

    it("should paginate results", async () => {
      // Create 25 blog objects
      for (let i = 0; i < 25; i++) {
        const blog = await request(app)
          .post("/api/blogs")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            title: `Blog ${i}`,
            body: `Body for blog ${i}`,
          });

        await Blog.findByIdAndUpdate(blog.body.data._id, {
          state: "published",
        });
      }

      // Fetch page 1 with limit=20
      const response = await request(app)
        .get("/api/blogs?page=1&limit=20")
        .expect(200);

      // Depending on your API shape:
      // - If you return blogs in `data` and pagination meta in `count/pages`:
      expect(response.body.count).toBe(20);
      expect(response.body.pages).toBeGreaterThan(1);
    }, 60000);

    it("should search by title", async () => {
      const response = await request(app)
        .get("/api/blogs?title=Published")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].title).toContain("Published");
    });

    it("should filter by tags", async () => {
      const response = await request(app)
        .get("/api/blogs?tags=published")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].tags).toContain("published");
    });

    it("should order by read_count", async () => {
      const blogs = await Blog.find({ state: "published" });
      await Blog.findByIdAndUpdate(blogs[0]._id, { read_count: 100 });

      const response = await request(app)
        .get("/api/blogs?order_by=read_count")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].read_count).toBe(100);
    });
  });

  describe("GET /api/blogs/:id", () => {
    let publishedBlogId;
    let draftBlogId;

    beforeEach(async () => {
      // Create published blog
      const published = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Published Single Blog",
          body: "Published content",
        });

      publishedBlogId = published.body.data._id;
      await Blog.findByIdAndUpdate(publishedBlogId, { state: "published" });

      // Create draft blog
      const draft = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Draft Single Blog",
          body: "Draft content",
        });

      draftBlogId = draft.body.data._id;
    });

    it("should get a published blog and increment read_count", async () => {
      const response = await request(app)
        .get(`/api/blogs/${publishedBlogId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.read_count).toBe(1);
      expect(response.body.data.author).toHaveProperty("first_name");

      // Check again to verify increment
      const response2 = await request(app)
        .get(`/api/blogs/${publishedBlogId}`)
        .expect(200);

      expect(response2.body.data.read_count).toBe(2);
    });

    it("should not allow non-owner to view draft blog", async () => {
      const response = await request(app)
        .get(`/api/blogs/${draftBlogId}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should allow owner to view draft blog", async () => {
      const response = await request(app)
        .get(`/api/blogs/${draftBlogId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.state).toBe("draft");
    });

    it("should return 404 for non-existent blog", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/blogs/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/blogs/user/me", () => {
    beforeEach(async () => {
      // Create blogs for first user
      await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "My Draft Blog",
          body: "Draft content",
        });

      const published = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "My Published Blog",
          body: "Published content",
        });

      await Blog.findByIdAndUpdate(published.body.data._id, {
        state: "published",
      });
    });

    it("should get user's own blogs", async () => {
      const response = await request(app)
        .get("/api/blogs/user/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
    });

    it("should filter by state", async () => {
      const response = await request(app)
        .get("/api/blogs/user/me?state=draft")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].state).toBe("draft");
    });

    it("should paginate user blogs", async () => {
      const response = await request(app)
        .get("/api/blogs/user/me?page=1&limit=1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.pages).toBe(2);
    });

    it("should fail without authentication", async () => {
      const response = await request(app).get("/api/blogs/user/me").expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PUT /api/blogs/:id", () => {
    let blogId;

    beforeEach(async () => {
      const blog = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Original Title",
          body: "Original body",
        });

      blogId = blog.body.data._id;
    });

    it("should update own blog", async () => {
      const response = await request(app)
        .put(`/api/blogs/${blogId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Updated Title",
          description: "Updated description",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Updated Title");
      expect(response.body.data.description).toBe("Updated description");
    });

    it("should not allow non-owner to update blog", async () => {
      const response = await request(app)
        .put(`/api/blogs/${blogId}`)
        .set("Authorization", `Bearer ${secondToken}`)
        .send({
          title: "Hacked Title",
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .put(`/api/blogs/${blogId}`)
        .send({
          title: "Unauthorized Update",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/blogs/:id/state", () => {
    let blogId;

    beforeEach(async () => {
      const blog = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "State Test Blog",
          body: "Testing state changes",
        });

      blogId = blog.body.data._id;
    });

    it("should publish a draft blog", async () => {
      const response = await request(app)
        .patch(`/api/blogs/${blogId}/state`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ state: "published" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.state).toBe("published");
    });

    it("should change published blog back to draft", async () => {
      await Blog.findByIdAndUpdate(blogId, { state: "published" });

      const response = await request(app)
        .patch(`/api/blogs/${blogId}/state`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ state: "draft" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.state).toBe("draft");
    });

    it("should reject invalid state", async () => {
      const response = await request(app)
        .patch(`/api/blogs/${blogId}/state`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ state: "invalid" })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should not allow non-owner to change state", async () => {
      const response = await request(app)
        .patch(`/api/blogs/${blogId}/state`)
        .set("Authorization", `Bearer ${secondToken}`)
        .send({ state: "published" })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/blogs/:id", () => {
    let blogId;

    beforeEach(async () => {
      const blog = await request(app)
        .post("/api/blogs")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Blog to Delete",
          body: "This will be deleted",
        });

      blogId = blog.body.data._id;
    });

    it("should delete own blog", async () => {
      const response = await request(app)
        .delete(`/api/blogs/${blogId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const checkBlog = await Blog.findById(blogId);
      expect(checkBlog).toBeNull();
    });

    it("should not allow non-owner to delete blog", async () => {
      const response = await request(app)
        .delete(`/api/blogs/${blogId}`)
        .set("Authorization", `Bearer ${secondToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);

      // Verify blog still exists
      const checkBlog = await Blog.findById(blogId);
      expect(checkBlog).not.toBeNull();
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .delete(`/api/blogs/${blogId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it("should return 404 for non-existent blog", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/blogs/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
