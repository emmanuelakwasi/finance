# Quick Deploy to Render

## Step-by-Step Instructions

### 1. Go to Render
Visit: https://render.com
Sign up/Login with GitHub

### 2. Create New Web Service
- Click "New +" button
- Select "Web Service"
- Connect your GitHub account if not already connected
- Select repository: `emmanuelakwasi/finance`

### 3. Configure Service
- **Name**: `finance-app` (or any name you like)
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `Desktop/Personal finance app` (leave empty if files are at root)
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free`

### 4. Add Environment Variables
Click "Advanced" → "Add Environment Variable"
- Key: `JWT_SECRET`
- Value: Generate a random string (e.g., use: https://randomkeygen.com)

### 5. Deploy
Click "Create Web Service"
Wait 5-10 minutes for deployment

### 6. Your App is Live!
Your app will be available at: `https://finance-app.onrender.com`

---

## Alternative: Deploy with Vercel (Even Easier)

1. Go to: https://vercel.com
2. Sign up with GitHub
3. Click "Add New Project"
4. Import repository: `emmanuelakwasi/finance`
5. Click "Deploy"
6. Done! Your app is live in 2 minutes
