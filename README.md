# QuestWhisper 🎙️

<div align="center">
  <img src="/public/whisper_logo.png" alt="QuestWhisper Logo" width="120" />
  
  **Your AI companion for everything**

  <p>Experience the future of productivity. QuestWhisper seamlessly integrates with your digital world - from Gmail and Google Workspace to web research and image generation - all through natural conversation with a truly intelligent AI.</p>

  [![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://reactjs.org/)
  [![License](https://img.shields.io/badge/license-Private-red.svg)]()
</div>

---

## ✨ Features

### 🤖 AI-Powered Conversations
- **Voice Chat**: Natural speech recognition with lifelike AI responses
- **Text-to-Speech (TTS)**: Hear AI responses with multiple voice options
- **Smart Memory**: Context-aware conversations that remember your preferences
- **Real-time Streaming**: See AI responses as they're generated

### 📧 Google Workspace Integration
- **Gmail**: Send, read, search, and organize emails through voice commands
- **Google Docs**: Create and edit documents automatically
- **Google Slides**: Generate presentations with AI assistance
- **Google Sheets**: Analyze data and create charts
- **Google Calendar**: Schedule meetings and manage your calendar
- **Google Forms**: Create surveys and collect feedback
- **Google Drive**: Access and manage files

### 🌐 Web Intelligence
- **Real-time Web Search**: Access the latest information from the web
- **Content Extraction**: Extract and analyze content from any webpage
- **Unsplash Integration**: Find and use high-quality images
- **Web Scraping**: Intelligent data extraction from websites

### 🎨 Creative Tools
- **AI Image Generation**: Create custom images from text descriptions (powered by Imagen)
- **Image Upload & Analysis**: Upload images for AI analysis
- **Slideshow Creation**: Automatically generate beautiful presentations
- **Visual Content**: Generate diagrams, charts, and illustrations

### 🧠 ML Studio
- **Custom Model Training**: Train your own machine learning models
- **Dataset Management**: Upload and manage training datasets
- **Model Deployment**: Deploy models with Google Vertex AI
- **Prediction API**: Make predictions with trained models
- **Training Insights**: Real-time training metrics and progress tracking

### 🔐 Security & Privacy
- **Google OAuth**: Secure authentication with Google Sign-In
- **Session Management**: JWT-based secure sessions with NextAuth.js
- **Role-Based Access**: User roles and permissions system
- **Data Encryption**: Secure storage of sensitive information

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- **MongoDB** (Atlas or local instance)
- **Firebase** project (for image storage)
- **Google Cloud** project with required APIs enabled

### Required API Keys & Credentials

You'll need the following:

#### 1. Google Cloud APIs
Enable these in [Google Cloud Console](https://console.cloud.google.com/):
- Gmail API
- Google Drive API
- Google Docs API
- Google Slides API
- Google Sheets API
- Google Calendar API
- Google Forms API
- Google OAuth 2.0 credentials

#### 2. Gemini AI API Key
Get it from [Google AI Studio](https://makersuite.google.com/app/apikey)

#### 3. MongoDB Connection String
From [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

#### 4. Firebase Service Account Key
From your [Firebase Console](https://console.firebase.google.com/)

#### 5. NextAuth Secret
Generate with: `openssl rand -base64 32`

---

## 📦 Installation

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd questwhisper
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Step 3: Environment Variables

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# MongoDB (from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/questwhisper?retryWrites=true&w=majority

# Gemini AI (from Google AI Studio)
GEMINI_API_KEY=your-gemini-api-key

# Firebase Configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google Cloud Storage (for ML Studio)
GCS_PROJECT_ID=your-gcs-project-id
GCS_BUCKET_NAME=your-bucket-name

# MCP Server API Key (for tool calling)
QUICK_WHISPER_MCP_API_KEY=your-mcp-api-key
```

### Step 4: Firebase Service Account

Place your `firebase_service_key.json` in the root directory (ensure it's in `.gitignore`).

### Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

---

## 📁 Project Structure

```
questwhisper/
├── public/                    # Static assets
│   ├── icons/                # UI icons (microphone, volume, etc.)
│   ├── logo.png              # App logo
│   └── og_banner.png         # Open Graph image
│
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # NextAuth.js authentication
│   │   │   ├── chat/         # Chat endpoints (text, voice, image)
│   │   │   ├── ml-models/    # ML Studio API endpoints
│   │   │   ├── share/        # Share conversation API
│   │   │   └── voice/        # Voice processing endpoints
│   │   │
│   │   ├── chat/             # Chat interface page
│   │   ├── live/             # Live voice chat page
│   │   ├── ml-studio/        # ML Studio pages
│   │   │   ├── create/       # Create new model
│   │   │   ├── dataset/      # Manage datasets
│   │   │   ├── models/       # View all models
│   │   │   ├── training/     # Training interface
│   │   │   └── prediction/   # Make predictions
│   │   │
│   │   ├── login/            # Login page
│   │   ├── interests/        # User interests page
│   │   ├── experts/          # Expert systems
│   │   └── page.js           # Landing page
│   │
│   ├── components/           # React components
│   │   ├── chat/             # Chat components
│   │   │   ├── ChatInput.js         # Message input
│   │   │   ├── ChatMessage.js       # Message display
│   │   │   ├── ChatSidebar.js       # Conversation sidebar
│   │   │   ├── LiveChat.js          # Live voice interface
│   │   │   ├── GeneratedImage.js    # Image generation UI
│   │   │   └── WaveformAnimation.js # Voice visualizer
│   │   │
│   │   └── landing/          # Landing page components
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAudio.js       # Audio recording/playback
│   │   └── useImageGeneration.js  # Image generation
│   │
│   ├── lib/                  # Core libraries
│   │   ├── auth.js           # NextAuth configuration
│   │   ├── firebase.js       # Firebase setup
│   │   ├── gcs.js            # Google Cloud Storage
│   │   ├── mongodb.js        # MongoDB connection
│   │   ├── largeLanguageModel.js  # AI logic & tool calling
│   │   ├── quest-ai-system-prompt.js     # AI system prompt
│   │   └── quest-voice-system-prompt.js  # Voice AI prompt
│   │
│   ├── models/               # MongoDB Mongoose models
│   │   ├── User.js           # User schema
│   │   ├── Chat.js           # Chat conversation schema
│   │   ├── MlModel.js        # ML model metadata
│   │   ├── Dataset.js        # Training dataset schema
│   │   └── SharedContent.js  # Shared conversations
│   │
│   ├── providers/            # React Context providers
│   │   ├── HeroUIThemeProvider.js    # Theme provider
│   │   └── UserAuthSessionProvider.js # Auth session
│   │
│   └── utils/                # Utility functions
│       ├── audioUtils.js     # Audio processing
│       ├── markdownComponents.js  # Markdown rendering
│       ├── messageUtils.js   # Message formatting
│       └── shareUtils.js     # Share functionality
│
├── .env.local                # Environment variables (not in git)
├── firebase_service_key.json # Firebase credentials (not in git)
├── package.json              # Dependencies
├── tailwind.config.mjs       # Tailwind configuration
└── README.md                 # This file
```

---

## 🎯 Usage Examples

### 💬 Chat Commands

```
"Send an email to john@example.com about the meeting tomorrow"
"Create a presentation about AI trends with 5 slides"
"Search the web for the latest news on climate change"
"Schedule a meeting with Sarah for next Tuesday at 2 PM"
"Analyze the data in my Q3 sales spreadsheet"
"Generate an image of a sunset over mountains"
"Create a Google Form to collect customer feedback"
"Find relevant images on Unsplash about technology"
```

### 🎤 Voice Features

1. Click the **microphone icon** to start voice input
2. Speak naturally - the AI understands context
3. Click **stop** when finished speaking
4. Enable **voice responses** to hear AI answers
5. Adjust voice speed and volume as needed

### 🖼️ Image Generation

```
"Generate an image of a futuristic city at night"
"Create a logo for a coffee shop called Bean Dreams"
"Design a professional banner for a tech blog"
```

### 🧠 ML Studio Workflow

1. Navigate to `/ml-studio`
2. Click **"Create New Model"**
3. Upload your training dataset (CSV format)
4. Configure model parameters:
   - Model name and description
   - Training epochs
   - Learning rate
5. Click **"Start Training"**
6. Monitor training progress in real-time
7. Deploy your model when training completes
8. Use the prediction API to make inferences

---

## 🔧 Configuration Guides

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   https://yourdomain.com/api/auth/callback/google
   ```
7. Copy Client ID and Client Secret to `.env.local`

### MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (Free M0 tier available)
3. Go to **Database Access** > **Add New Database User**
   - Username: `your-username`
   - Password: `your-password` (save this!)
   - Built-in Role: **Read and write to any database**
4. Go to **Network Access** > **Add IP Address**
   - For development: `0.0.0.0/0` (allow all)
   - For production: Add your server's IP
5. Go to **Databases** > **Connect** > **Connect your application**
6. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/questwhisper?retryWrites=true&w=majority
   ```
7. Replace `<username>` and `<password>` with your credentials
8. Add to `.env.local` as `MONGODB_URI`

**Important**: If your password contains special characters, URL encode them:
- `@` → `%40`
- `!` → `%21`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Go to **Project Settings** > **Service accounts**
4. Click **Generate new private key**
5. Save as `firebase_service_key.json` in root directory
6. Go to **Project Settings** > **General**
7. Scroll to **Your apps** > **Web app**
8. Copy the Firebase config to `.env.local`
9. Go to **Storage** in sidebar
10. Click **Get Started** > **Start in production mode**
11. Update Storage Rules:
    ```javascript
    rules_version = '2';
    service firebase.storage {
      match /b/{bucket}/o {
        match /{allPaths=**} {
          allow read, write: if request.auth != null;
        }
      }
    }
    ```

---

## 🐛 Troubleshooting

### MongoDB Connection Error: `ENOTFOUND`

**Error message:**
```
MongoDB connection error: [Error: querySrv ENOTFOUND _mongodb._tcp.cluster.mongodb.net]
```

**Solutions:**

#### 1. Check Connection String Format

Ensure your `MONGODB_URI` follows this exact format:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

Verify:
- ✅ `username` matches your MongoDB user
- ✅ `password` is correct (and URL encoded if it has special characters)
- ✅ `cluster` matches your actual cluster name from MongoDB Atlas
- ✅ `database` is specified (e.g., `questwhisper`)

#### 2. URL Encode Special Characters in Password

If your password contains special characters, encode them:

```javascript
// Before: p@ss!word#123
// After:  p%40ss%21word%23123

// Common encodings:
@ → %40
! → %21
# → %23
$ → %24
% → %25
& → %26
= → %3D
+ → %2B
```

**Quick test:**
```javascript
const password = "p@ss!word";
const encoded = encodeURIComponent(password);
console.log(encoded); // p%40ss%21word
```

#### 3. Whitelist IP Address

In MongoDB Atlas:
1. Go to **Network Access**
2. Click **Add IP Address**
3. For development: Add `0.0.0.0/0` (temporary!)
4. For production: Add your server's specific IP

#### 4. Test DNS Resolution

```bash
# Test if MongoDB hostname resolves
nslookup cluster.mongodb.net

# If this fails, try using Google DNS:
# macOS/Linux:
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# Windows:
# Go to Network Settings > Change Adapter > DNS > Use 8.8.8.8
```

#### 5. Try Standard Connection String (Alternative)

If SRV lookup fails, use standard format:

```env
MONGODB_URI=mongodb://username:password@cluster-shard-00-00.mongodb.net:27017,cluster-shard-00-01.mongodb.net:27017,cluster-shard-00-02.mongodb.net:27017/database?ssl=true&replicaSet=atlas-shard-0&authSource=admin&retryWrites=true&w=majority
```

#### 6. Test Connection Locally

Create `test-mongo.js`:
```javascript
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
```

Run: `node test-mongo.js`

---

### Google OAuth Not Working

**Issue**: Redirect URI mismatch error

**Solution**:
1. Check authorized redirect URIs in Google Cloud Console
2. Ensure `NEXTAUTH_URL` in `.env.local` matches your domain
3. Clear browser cookies and try again
4. Verify all required scopes are enabled in OAuth consent screen

---

### Voice Features Not Working

**Issue**: Microphone not accessible

**Solutions**:
1. Grant microphone permissions in browser
2. Use HTTPS (required for Web Speech API)
3. Try Chrome or Edge (best compatibility)
4. Check browser console for specific errors

---

### Image Generation Failing

**Issue**: Images not generating or saving

**Solutions**:
1. Verify `GEMINI_API_KEY` is valid and has Imagen API access
2. Check Firebase Storage rules allow authenticated writes
3. Ensure sufficient API quota in Google Cloud Console
4. Check browser console for specific error messages

---

### Build Errors

**Issue**: Next.js build fails

**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import in Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables**
   - In Vercel dashboard, go to **Settings** > **Environment Variables**
   - Add all variables from `.env.local`
   - Update `NEXTAUTH_URL` to your production URL:
     ```
     NEXTAUTH_URL=https://your-app.vercel.app
     ```

4. **Add `firebase_service_key.json` Contents**
   - Option A: Add as environment variable:
     ```
     FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
     ```
     Then update `src/lib/gcs.js` to parse from env var
   
   - Option B: Use Vercel Secrets (recommended)

5. **Deploy**
   - Click **Deploy**
   - Your app will be live at `https://your-app.vercel.app`

6. **Update Google OAuth**
   - Add production URL to authorized redirect URIs:
     ```
     https://your-app.vercel.app/api/auth/callback/google
     ```

### Deploy to Other Platforms

**Netlify**:
- Similar to Vercel
- Add build command: `npm run build`
- Publish directory: `.next`

**Docker**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development with Turbopack (faster)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Run linter with auto-fix
npm run lint -- --fix
```

### Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Frontend** | React 19 |
| **Styling** | Tailwind CSS 4 |
| **Animation** | Framer Motion |
| **UI Components** | HeroUI, Heroicons |
| **Authentication** | NextAuth.js |
| **Database** | MongoDB with Mongoose |
| **AI/ML** | Google Gemini AI, Vertex AI |
| **Cloud Storage** | Firebase, Google Cloud Storage |
| **Voice** | Web Speech API |
| **Real-time** | Server-Sent Events (SSE) |
| **Markdown** | React Markdown, remark-gfm |
| **Code Highlighting** | Prism React Renderer |
| **HTTP Client** | Axios |
| **Icons** | React Icons |
| **State Management** | React Hooks, SWR |

### Project Dependencies

```json
{
  "dependencies": {
    "@google-cloud/storage": "^7.16.0",
    "@google/genai": "1.13.0",
    "@heroui/react": "^2.7.10",
    "axios": "^1.10.0",
    "firebase": "^11.10.0",
    "framer-motion": "^12.18.1",
    "googleapis": "^150.0.1",
    "mongoose": "^8.16.0",
    "next": "15.3.4",
    "next-auth": "^4.24.11",
    "react": "^19.0.0",
    "react-markdown": "^10.1.0"
  }
}
```

### Code Style

- **ESLint** for linting
- Use functional components with hooks
- TypeScript types in JSDoc comments
- Modular file structure
- Consistent naming conventions

---

## 🔐 Security Best Practices

### Environment Variables
✅ **DO**:
- Store all secrets in `.env.local`
- Use different values for dev/production
- Add `.env.local` to `.gitignore`

❌ **DON'T**:
- Commit API keys to version control
- Use production secrets in development
- Share `.env` files publicly

### API Routes
✅ **DO**:
- Validate user authentication
- Sanitize user inputs
- Implement rate limiting
- Use CORS headers appropriately

### Database
✅ **DO**:
- Use parameterized queries (Mongoose handles this)
- Implement proper indexes
- Validate data before saving
- Use MongoDB connection pooling

### Dependencies
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Update dependencies
npm update
```

---

## 📊 Features Roadmap

### In Progress
- [ ] Multi-language support (i18n)
- [ ] Dark mode enhancements
- [ ] Advanced voice commands

### Planned
- [ ] Team collaboration features
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Slack/Discord integration
- [ ] Webhook system
- [ ] Plugin architecture
- [ ] Real-time collaboration
- [ ] Advanced ML model templates
- [ ] Custom AI training on user data
- [ ] Video generation
- [ ] Document Q&A
- [ ] Smart notifications

---

## 🤝 Contributing

This is a private project. If you have access:

1. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Test your changes locally

3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

4. **Push to branch**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open a Pull Request**
   - Describe your changes
   - Link any related issues
   - Request review from team

---

## 📄 API Documentation

### Chat API

**POST** `/api/chat`
```json
{
  "message": "Your message here",
  "chatId": "optional-chat-id",
  "userId": "user-id"
}
```

### Image Generation API

**POST** `/api/chat/image-generation`
```json
{
  "prompt": "Image description",
  "userId": "user-id"
}
```

### ML Model Prediction API

**POST** `/api/ml-models/predict`
```json
{
  "modelId": "model-id",
  "input": {
    "feature1": 123,
    "feature2": "value"
  }
}
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Gemini AI Documentation](https://ai.google.dev/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 💬 Support

Need help? Here's how to get support:

1. **Check Documentation**: Review this README and linked resources
2. **Troubleshooting Section**: Common issues and solutions above
3. **Email Support**: [support@iwhispered.com](mailto:support@iwhispered.com)
4. **Bug Reports**: Open an issue in the repository

---

## 🙏 Acknowledgments

- **Google** for Gemini AI, Google Cloud Platform, and Workspace APIs
- **Vercel** for Next.js framework and hosting platform
- **MongoDB** for database services
- **Firebase** for storage and real-time capabilities
- **Open Source Community** for amazing libraries and tools

---

## 📝 License

This is a **private project**. All rights reserved.

Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

<div align="center">
  <p>Built with ❤️ using Next.js, React, and Google Gemini AI</p>
  <p><strong>© 2025 QuestWhisper. All rights reserved.</strong></p>
  
  <br/>
  
  <p>
    <a href="https://quest-lime-six.vercel.app/">Website</a> •
    <a href="/privacy-policy">Privacy</a> •
    <a href="/terms-of-service">Terms</a> •
    <a href="mailto:minyoinosiku@gmail.com">Contact</a>
  </p>
</div>
