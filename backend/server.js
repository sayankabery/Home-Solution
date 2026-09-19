// Fix for 'crypto is not defined' issue
const crypto = require('crypto');
if (!global.crypto) {
  global.crypto = crypto;
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
app.use(express.json());
app.use(cors());

// Auto Start In-Memory MongoDB Server
async function startDatabaseAndServer() {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
    console.log('MongoDB Connected Successfully (In-Memory DB Running)');

    const PORT = 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
}

// Schemas
const UserSchema = new mongoose.Schema({
  role: String,
  name: String,
  email: { type: String, unique: true },
  pass: String,
  mobile: String,
  address: String,
  profession: String,
  workingCount: { type: Number, default: 0 },
  rating: { type: String, default: '5.0' },
  complains: [String]
});

const PostSchema = new mongoose.Schema({
  userId: String,
  customerName: String,
  workType: String,
  category: String,
  details: String,
  address: String,
  image: String,
  comments: [{
    id: Number,
    userId: String,
    userName: String,
    text: String,
    replies: [{
      id: Number,
      userId: String,
      userName: String,
      text: String
    }]
  }]
});

const User = mongoose.model('User', UserSchema);
const Post = mongoose.model('Post', PostSchema);

// Auth Routes
app.post('/api/signup', async (req, res) => {
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const newUser = new User(req.body);
    await newUser.save();
    res.json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email, pass: req.body.pass, role: req.body.role });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Data Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ _id: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const newPost = new Post(req.body);
    await newPost.save();
    res.json(newPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts/:id/comment', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.comments.push(req.body);
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
startDatabaseAndServer();