const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const multer = require('multer');
require('dotenv').config();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = uniqueSuffix + extension;
    console.log('Generated filename:', filename, 'Extension:', extension, 'Original:', file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ storage: storage });

// Initialize Telegram Bot for notifications
const bot = new TelegramBot('8413695591:AAEoZpel959v8gO-I5Zb1GCPmJESmHimgjQ', { polling: false });

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Add Content Security Policy middleware
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' http://localhost:*; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:;"
  );
  next();
});

// Define specific routes for static HTML files
app.get('/', (req, res) => {
  console.log('Serving index.html for path:', req.path);
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  console.log('Serving admin-login.html for path:', req.path);
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin/login', (req, res) => {
  console.log('Serving admin-login.html for path:', req.path);
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  console.log('Serving admin-dashboard.html for path:', req.path);
  res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Handle .well-known routes
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.json({});
});

// Fallback route for any other routes not handled above
app.use((req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }

  // For other routes, serve index.html or 404
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle Chrome DevTools requests
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(200).json({});
});

// Connect to MongoDB
mongoose.connect('mongodb+srv://Kidus:sy75bg03zmgoHh7P@cluster0.cwkhv7q.mongodb.net/smartcampus', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const applicationSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'visa' or 'travel'
  destination: { type: String, required: true },
  details: { type: String, required: true },
  status: { type: String, default: 'review' }, // review, approved, rejected, confirmed
  userId: { type: String, required: true }, // Telegram user ID
  contactInfo: {
    email: { type: String, required: true },
    phone: { type: String, required: true },
    telegramUsername: { type: String }
  },
  documents: [{ filename: String, originalname: String }], // array of file objects
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createdAt: { type: Date, default: Date.now }
});

const Application = mongoose.model('Application', applicationSchema);
const User = mongoose.model('User', userSchema);

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Routes
app.post('/api/applications', upload.array('documents', 10), async (req, res) => {
  try {
    const { type, destination, details, userId, email, phone, telegramUsername } = req.body;
    const documents = req.files ? req.files.map(file => ({ filename: file.filename, originalname: file.originalname })) : [];
    console.log('Uploaded files:', req.files);
    console.log('Documents:', documents);

    const application = new Application({
      type,
      destination,
      details,
      userId,
      contactInfo: { email, phone, telegramUsername },
      documents
    });
    await application.save();

    // Send confirmation message to user
    const confirmationMessage = `📋 **Application Received!**\n\nThank you for submitting your ${application.type} application to ${application.destination}.\n\n📋 Details: ${application.details}\n📅 Submitted: ${new Date(application.createdAt).toLocaleDateString()}\n\nYour application is now under review. We'll notify you once there's an update.\n\nFor any questions, contact us at info@visagency.com\n\nThank you for choosing Visa & Travel Agency! 🌍`;

    try {
      await bot.sendMessage(application.userId, confirmationMessage);
    } catch (botErr) {
      console.error('Error sending confirmation message:', botErr);
    }

    res.status(201).json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/applications/:userId', async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.params.userId });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/applications', authenticateToken, async (req, res) => {
  try {
    const applications = await Application.find().sort({ createdAt: -1 });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/applications/:id', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(application);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/admin/notify/:id', authenticateToken, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Send notification via Telegram bot
    let message = '';
    if (application.status === 'approved') {
      message = `🎉 **Great News!**\n\nYour ${application.type} application to ${application.destination} has been APPROVED!\n\n📋 Details: ${application.details}\n📅 Submitted: ${new Date(application.createdAt).toLocaleDateString()}\n\nPlease contact us at info@visagency.com for next steps.\n\nThank you for choosing Visa & Travel Agency! 🌍`;
    } else if (application.status === 'rejected') {
      message = `📋 **Application Update**\n\nWe regret to inform you that your ${application.type} application to ${application.destination} has been REJECTED.\n\n📋 Details: ${application.details}\n📅 Submitted: ${new Date(application.createdAt).toLocaleDateString()}\n\nFor more information, please contact our support team at info@visagency.com\n\nWe apologize for any inconvenience caused.`;
    } else if (application.status === 'confirmed') {
      message = `✅ **Booking Confirmed!**\n\nYour ${application.type} booking to ${application.destination} has been CONFIRMED!\n\n📋 Details: ${application.details}\n📅 Submitted: ${new Date(application.createdAt).toLocaleDateString()}\n\nYou will receive a confirmation email shortly with all the details.\n\nSafe travels! ✈️`;
    }

    if (message) {
      try {
        await bot.sendMessage(application.userId, message);
        res.json({ message: 'Notification sent successfully' });
      } catch (botErr) {
        console.error('Error sending Telegram message:', botErr);
        res.status(500).json({ error: 'Failed to send notification' });
      }
    } else {
      res.status(400).json({ error: 'Invalid status for notification' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username, password);
    const user = await User.findOne({ username });
    console.log('User found:', user ? 'yes' : 'no');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log('Invalid credentials for user:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual admin creation route (for testing)
app.post('/api/admin/create', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('admin', 10);
    const admin = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });
    await admin.save();
    res.json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin', 10);
    await User.findOneAndUpdate(
      { username: 'admin' },
      {
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
      },
      { upsert: true, new: true }
    );
    console.log('Default admin user set: admin/admin');
  } catch (err) {
    console.error('Error creating default admin:', err);
  }
};

// Wait for MongoDB connection before creating admin
mongoose.connection.once('open', () => {
  console.log('MongoDB connection established');
  createDefaultAdmin();
  createSampleData();
});

// Create sample applications for testing
const createSampleData = async () => {
  try {
    const existingApps = await Application.countDocuments();
    if (existingApps === 0) {
      const sampleApps = [
        {
          type: 'visa',
          destination: 'USA',
          details: 'Tourist',
          status: 'review',
          userId: 'sample_user_1',
          contactInfo: {
            email: 'john.doe@email.com',
            phone: '+1234567890',
            telegramUsername: '@johndoe'
          }
        },
        {
          type: 'visa',
          destination: 'Canada',
          details: 'Business',
          status: 'approved',
          userId: 'sample_user_2',
          contactInfo: {
            email: 'jane.smith@email.com',
            phone: '+1987654321',
            telegramUsername: '@janesmith'
          }
        },
        {
          type: 'travel',
          destination: 'France',
          details: 'Flight for 2 passengers',
          status: 'confirmed',
          userId: 'sample_user_1',
          contactInfo: {
            email: 'john.doe@email.com',
            phone: '+1234567890',
            telegramUsername: '@johndoe'
          }
        },
        {
          type: 'visa',
          destination: 'UK',
          details: 'Student',
          status: 'rejected',
          userId: 'sample_user_3',
          contactInfo: {
            email: 'student@email.com',
            phone: '+1555123456',
            telegramUsername: '@student123'
          }
        }
      ];

      await Application.insertMany(sampleApps);
      console.log('Sample applications created');
    }
  } catch (err) {
    console.error('Error creating sample data:', err);
  }
};

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});