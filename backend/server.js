const crypto = require('crypto');

if (!global.crypto) {
  global.crypto = crypto;
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

app.use(express.static(path.join(__dirname, '../frontend')));

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

async function createAdminUser() {
  try {
    const adminEmail = 'sayankabery22@gmail.com';
    const adminPass = 'Kabery2004';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new User({
        role: 'Admin',
        name: 'Admin',
        email: adminEmail,
        pass: adminPass
      });
      await admin.save();
    }
  } catch (err) {
    console.error('Admin user creation error:', err.message);
  }
}

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

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/:id/rate', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (req.body.rating) {
      user.rating = req.body.rating;
      await user.save();
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
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

app.delete('/api/posts/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted successfully' });
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

app.delete('/api/posts/:postId/comment/:commentId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.comments = post.comments.filter(c => c.id.toString() !== req.params.commentId.toString());
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index_4.html'));
});

async function startDatabaseAndServer() {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://sayankabery22_db_user:Kabery2004@cluster0.spnqtw5.mongodb.net/?appName=Cluster0";
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected Successfully');

    await createAdminUser();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
}

startDatabaseAndServer();