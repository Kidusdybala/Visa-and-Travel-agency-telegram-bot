# Visa & Travel Agency Telegram Bot

A comprehensive web application and Telegram bot system for managing visa and travel applications. The system allows users to submit visa/travel applications through a Telegram bot and provides an admin dashboard for managing applications.

## 🌟 Features

### For Users (via Telegram Bot)
- **Visa Applications**: Submit tourist, business, or student visa applications
- **Travel Bookings**: Book flights and travel packages
- **Document Upload**: Upload supporting documents (PDFs, images, Word docs)
- **Application Tracking**: Real-time status updates
- **Contact Support**: Direct communication with agency staff

### For Administrators
- **Admin Dashboard**: Web-based admin interface
- **Application Management**: View, approve, reject, and confirm applications
- **Document Preview**: Preview uploaded documents directly in the dashboard
- **Status Updates**: Change application statuses with automatic notifications
- **Statistics**: View application statistics and metrics
- **User Management**: Admin authentication and authorization

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Multer** - File upload handling
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Frontend
- **HTML5/CSS3** - Responsive web interface
- **JavaScript (ES6+)** - Client-side functionality
- **Telegram Bot API** - Bot integration

### External Services
- **Telegram Bot API** - For bot functionality
- **MongoDB Atlas** - Cloud database
- **Ngrok** - Local development tunneling

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Telegram Bot Token
- Ngrok account (for development)

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Kidusdybala/Visa-and-Travel-agency-telegram-bot.git
cd visa-and-travel-agency-telegram-bot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Telegram Bot Token
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 4. Database Setup
1. Create a MongoDB Atlas cluster
2. Get your connection string
3. Update the `MONGODB_URI` in your `.env` file

### 5. Telegram Bot Setup
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot and get your token
3. Update the `TELEGRAM_BOT_TOKEN` in your `.env` file

### 6. Create Admin User
The application automatically creates a default admin user on startup:
- **Username**: `admin`
- **Password**: `admin`

### 7. Start the Application
```bash
# Development mode
npm run server

# The server will start on http://localhost:3000
```

### 8. Ngrok Setup (for Telegram webhooks)
```bash
# Install ngrok
# Expose local server to internet
ngrok http 3000
```

## 📖 Usage

### User Flow
1. **Start the Bot**: Users message your Telegram bot
2. **Submit Application**: Choose visa/travel service and fill out the form
3. **Upload Documents**: Attach required documents
4. **Track Status**: Receive updates on application progress
5. **Get Notifications**: Automatic status change notifications

### Admin Flow
1. **Login**: Access admin dashboard at `/admin`
2. **View Applications**: See all submitted applications
3. **Review Documents**: Preview uploaded files
4. **Update Status**: Approve, reject, or confirm applications
5. **Send Notifications**: Notify users of status changes

## 🔌 API Endpoints

### Public Endpoints
- `GET /` - Main application page
- `GET /admin` - Admin login page
- `GET /admin/dashboard` - Admin dashboard (protected)

### API Endpoints
- `POST /api/applications` - Submit new application
- `GET /api/applications/:userId` - Get user's applications
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/applications` - Get all applications (admin only)
- `PUT /api/admin/applications/:id` - Update application status (admin only)
- `POST /api/admin/notify/:id` - Send notification to user (admin only)

### File Serving
- `GET /uploads/:filename` - Serve uploaded files

## 📁 Project Structure

```
visa-and-travel-agency-telegram-bot/
├── bot.js                 # Telegram bot logic
├── server.js              # Main Express server
├── package.json           # Dependencies and scripts
├── public/                # Static web files
│   ├── index.html        # Main user interface
│   ├── admin-login.html  # Admin login page
│   ├── admin-dashboard.html # Admin dashboard
│   └── ...               # Other HTML pages
├── uploads/              # Uploaded files directory
├── node_modules/         # Dependencies
└── README.md            # This file
```

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | Yes |
| `PORT` | Server port (default: 3000) | No |
| `NODE_ENV` | Environment mode | No |

### Database Models

#### Application Schema
```javascript
{
  type: String,           // 'visa' or 'travel'
  destination: String,    // Destination country/city
  details: String,        // Application details
  status: String,         // 'review', 'approved', 'rejected', 'confirmed'
  userId: String,         // Telegram user ID
  contactInfo: {
    email: String,
    phone: String,
    telegramUsername: String
  },
  documents: [{           // Array of uploaded files
    filename: String,
    originalname: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### User Schema (Admin)
```javascript
{
  username: String,       // Admin username
  password: String,       // Hashed password
  role: String,          // User role (default: 'admin')
  createdAt: Date
}
```

## 🚀 Deployment

### Production Deployment
1. Set `NODE_ENV=production` in environment variables
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "visa-bot"
   ```
3. Set up a reverse proxy (nginx) for production
4. Configure SSL certificates
5. Set up proper file storage (AWS S3, etc.)

### Docker Deployment
```dockerfile
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "run", "server"]
```

## 🐛 Troubleshooting

### Common Issues

1. **File Upload Issues**
   - Ensure `uploads/` directory exists and is writable
   - Check file size limits in multer configuration

2. **Telegram Bot Not Responding**
   - Verify bot token is correct
   - Check if webhook URL is properly set
   - Ensure ngrok tunnel is active

3. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check network connectivity
   - Ensure IP whitelist includes your server IP

4. **Admin Login Issues**
   - Default credentials: `admin` / `admin`
   - Check JWT secret configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines
- Follow ESLint configuration
- Write meaningful commit messages
- Test all features before submitting PR
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the troubleshooting section above

## 🔄 Recent Updates

### v1.0.0
- ✅ Fixed file upload extension preservation
- ✅ Improved document preview in admin dashboard
- ✅ Enhanced error handling and logging
- ✅ Added comprehensive README documentation

---

**Built with ❤️ for efficient visa and travel application management**