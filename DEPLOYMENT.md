# Laundry Planet - Deployment Guide

## Deploying to Render.com

### Prerequisites
- Render.com account
- MongoDB Atlas account (for database)
- Git repository with your code

### Step 1: Prepare MongoDB Atlas
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with password
3. Whitelist all IPs (0.0.0.0/0) for Render access
4. Copy your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/laundry-planet`)

### Step 2: Deploy on Render
1. Go to [Render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub/GitLab repository
4. Configure the service:
   - **Name**: laundry-planet
   - **Region**: Choose closest to your users
   - **Branch**: main (or your default branch)
   - **Root Directory**: Leave empty (use root of repository)
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### Step 3: Environment Variables
Add these environment variables in Render dashboard:
- `NODE_ENV` = `production`
- `PORT` = `5000` (Render will override this automatically)
- `MONGODB_URI` = Your MongoDB Atlas connection string
- `JWT_SECRET` = Your secure random string (generate one with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `JWT_EXPIRE` = `7d`

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your application
3. Once deployed, your app will be available at: `https://laundry-planet.onrender.com`

### Important Notes
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep may take 30-60 seconds
- For production, consider upgrading to paid tier for better performance
- The frontend is built and served from the backend, so only one deployment needed

### Local Testing
Test the deployment setup locally:
```bash
cd backend
npm run build  # Builds frontend
npm start      # Starts server with frontend
```
Open browser to http://localhost:5000

### Updating After Deployment
1. Push changes to your Git repository
2. Render will automatically rebuild and redeploy
3. Or manually trigger deploy from Render dashboard

### Troubleshooting
- Check Render logs for errors
- Ensure MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Verify all environment variables are set correctly
- Frontend API calls should use relative paths (/api/*) not localhost
