# Blogging API - AltSchool Project

A RESTful blogging API built with Node.js, Express, and MongoDB. Users can create, read, update, and delete blog posts with authentication and authorization.

## 🚀 Features

- ✅ User authentication with JWT (1-hour expiry)
- ✅ Create, read, update, and delete blogs
- ✅ Draft and published blog states
- ✅ Pagination, search, and filtering
- ✅ Automatic reading time calculation
- ✅ Read count tracking
- ✅ Protected routes for blog owners
- ✅ Comprehensive test suite

## 📋 Requirements

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd blogging-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/blogging-api
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=1h
NODE_ENV=development
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# If using MongoDB locally
mongod
```

### 5. Run the application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 🧪 Running Tests

```bash
npm test
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### 1. Sign Up

```http
POST /auth/signup
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Sign In

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Blog Endpoints

#### 1. Create Blog (Protected)

```http
POST /blogs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My First Blog",
  "description": "An introduction to blogging",
  "tags": ["introduction", "blogging"],
  "body": "This is the content of my blog post..."
}
```

#### 2. Get All Published Blogs (Public)

```http
GET /blogs?page=1&limit=20&order_by=read_count&title=search&tags=tag1,tag2
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `order_by` (optional): Sort by `read_count`, `reading_time`, or `createdAt`
- `title` (optional): Search by title
- `tags` (optional): Filter by tags (comma-separated)
- `author` (optional): Search by author name

#### 3. Get Single Blog (Public/Protected)

```http
GET /blogs/:id
Authorization: Bearer <token> (optional, required for draft blogs)
```

**Note:** Read count increases by 1 on each view

#### 4. Get User's Blogs (Protected)

```http
GET /blogs/user/me?page=1&limit=20&state=draft
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `state` (optional): Filter by `draft` or `published`

#### 5. Update Blog (Protected - Owner Only)

```http
PUT /blogs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "body": "Updated content..."
}
```

#### 6. Update Blog State (Protected - Owner Only)

```http
PATCH /blogs/:id/state
Authorization: Bearer <token>
Content-Type: application/json

{
  "state": "published"
}
```

**Valid states:** `draft`, `published`

#### 7. Delete Blog (Protected - Owner Only)

```http
DELETE /blogs/:id
Authorization: Bearer <token>
```

## 📁 Project Structure

```
blogging-api/
├── controllers/
│   ├── authController.js
│   └── blogController.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── models/
│   ├── User.js
│   └── Blog.js
├── routes/
│   ├── authRoutes.js
│   └── blogRoutes.js
├── tests/
│   ├── auth.test.js
│   └── blog.test.js
├── .env
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## 🚀 Deployment Guide

### Deploy to Render

1. **Create a Render account** at [render.com](https://render.com)

2. **Create a new Web Service**

   - Connect your GitHub repository
   - Select your branch

3. **Configure the service**

   - Name: `blogging-api`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Add environment variables**

   - `MONGODB_URI`: Your MongoDB connection string (use MongoDB Atlas)
   - `JWT_SECRET`: A secure random string
   - `JWT_EXPIRE`: `1h`
   - `NODE_ENV`: `production`

5. **Deploy** and get your live URL!

### Deploy to Heroku (Alternative)

1. **Install Heroku CLI**

```bash
npm install -g heroku
```

2. **Login to Heroku**

```bash
heroku login
```

3. **Create a new Heroku app**

```bash
heroku create your-app-name
```

4. **Add MongoDB Atlas**

   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string

5. **Set environment variables**

```bash
heroku config:set MONGODB_URI="your-mongodb-uri"
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set JWT_EXPIRE="1h"
heroku config:set NODE_ENV="production"
```

6. **Deploy**

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

7. **Open your app**

```bash
heroku open
```

## 🗄️ MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier M0)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Add to your `.env` file or deployment environment variables

## 🔒 Security Notes

- Always use a strong `JWT_SECRET` in production
- Never commit `.env` files to version control
- Use HTTPS in production
- Implement rate limiting for production use
- Consider adding helmet.js for additional security headers

## 📝 Example Usage with cURL

### Sign Up

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create Blog

```bash
curl -X POST http://localhost:3000/api/blogs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "My First Blog",
    "body": "This is my first blog post content...",
    "tags": ["tutorial", "nodejs"]
  }'
```

### Get Published Blogs

```bash
curl http://localhost:3000/api/blogs?page=1&limit=10
```

## 🧩 MVC Pattern

This project follows the MVC (Model-View-Controller) architecture:

- **Models** (`models/`): Define data structure and business logic
- **Views**: JSON responses (REST API)
- **Controllers** (`controllers/`): Handle request/response logic
- **Routes** (`routes/`): Define API endpoints
- **Middleware** (`middleware/`): Authentication and error handling

## 🎯 Key Features Implemented

- ✅ JWT authentication with 1-hour expiry
- ✅ Blog states (draft/published)
- ✅ Pagination (default 20 per page)
- ✅ Search by author, title, tags
- ✅ Sort by read_count, reading_time, timestamp
- ✅ Automatic reading time calculation (200 words/minute)
- ✅ Read count increment on view
- ✅ Owner-only edit/delete
- ✅ User info returned with blog
- ✅ Comprehensive test coverage

## 📞 Support

For issues or questions, please open an issue on GitHub.

## 📄 License

This project is licensed under the ISC License.

---

**Built with ❤️ for AltSchool Second Semester Project**
