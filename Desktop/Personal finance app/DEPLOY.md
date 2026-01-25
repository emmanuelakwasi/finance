# Deployment Guide

## Option 1: Render (Recommended - Free & Easy)

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `emmanuelakwasi/finance`
4. Configure:
   - **Name**: finance-app
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (generate a random string)
   - `PORT`: (auto-set by Render)
6. Click "Create Web Service"
7. Your app will be live at: `https://finance-app.onrender.com`

## Option 2: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Your app will be live automatically

## Option 3: Railway

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js and deploys
5. Add environment variable: `JWT_SECRET`
6. Your app will be live automatically

## Option 4: Heroku

1. Install Heroku CLI: `heroku login`
2. Run: `heroku create finance-app`
3. Run: `git push heroku main`
4. Set environment variable: `heroku config:set JWT_SECRET=your-secret`
5. Your app will be live at: `https://finance-app.herokuapp.com`
