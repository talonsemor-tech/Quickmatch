
# Quickmatch Connect – ULTRA PRO Scaffold

A full-stack scalable dating platform starter.

## Features
- Next.js responsive frontend
- Express API
- Separate Socket.io realtime server (non-blocking)
- PostgreSQL database
- Redis support
- Swipe / match API
- Image + voice upload endpoints
- Cloudinary-ready media service
- VIP anonymous profiles
- Admin dashboard API
- Payment webhook placeholders (M-Pesa / card)
- Docker deployment
- GitHub-ready

## Recent Fixes
- ✅ Fixed oversized photo upload (5MB limit, image validation)
- ✅ Improved admin registration form design
- ✅ Fixed login after registration flow
- ✅ Added network error handling for admin registration
- ✅ Created missing uploads directory
- ✅ Added database initialization script
- ✅ Created complete user dashboard, discover, chat, and profile pages
- ✅ Added real-time messaging with Socket.io
- ✅ Implemented swipe matching system
- ✅ Added login form to homepage
- ✅ Created comprehensive API endpoints

## Run locally

### 1. Start infrastructure
```bash
docker compose up -d
```

### 2. Initialize database
```bash
cd api-server
npm install
npm run init-db
```

### 3. Start API
```bash
cd api-server
npm run dev
```

### 4. Start socket server
```bash
cd socket-server
npm install
npm run dev
```

### 5. Start frontend
```bash
cd client
npm install
npm run dev
```

### 6. Test server
```bash
node test-server.js
```

Open:
- **Homepage/Login**: http://localhost:3000/index.html
- **User Registration**: http://localhost:3000/register.html
- **User Dashboard**: http://localhost:3000/dashboard.html (after login)
- **Discover**: http://localhost:3000/discover.html
- **Messages**: http://localhost:3000/chat.html
- **Profile**: http://localhost:3000/profile.html
- **Admin Registration**: http://localhost:3000/admin-register.html
- **Admin Panel**: http://localhost:3000/admin.html

## Features Overview

### For Users:
- **Dashboard**: View stats, recent activity, quick actions
- **Discover**: Swipe through profiles, like/pass users
- **Chat**: Real-time messaging with matches
- **Profile**: View and edit personal information
- **VIP**: Premium features and upgrades

### For Admins:
- **User Management**: View, edit, delete users
- **Content Moderation**: Monitor posts and messages
- **Statistics**: View platform analytics
- **System Administration**: Manage the platform

## Database Schema
The system includes these tables:
- `users` - User accounts and profiles
- `profiles` - Extended user information
- `matches` - User connections
- `messages` - Chat messages
- `swipes` - Like/pass actions
- `posts` - User posts
- `profile_views` - Profile view tracking
- `payments` - Payment transactions

## Troubleshooting

### Admin Registration Issues
- **Network error**: Ensure API server is running on port 3001
- **Oversized photo**: Images must be under 5MB and valid image format
- **Login not working**: Check browser console for errors, ensure database is initialized

### Database Issues
- **Connection failed**: Run `docker compose up -d` or setup local PostgreSQL
- **Schema not loaded**: Run `cd api-server && npm run init-db`

### Server Issues
- **Port conflict**: Check if port 3001 is available
- **Dependencies**: Run `npm install` in each service directory

---

## GitHub & CI

This repository includes a [GitHub Actions](.github/workflows/ci.yml) workflow that installs dependencies for each subproject and builds the frontend.  Pushing or creating a pull request against `main` (or `master`) will trigger the check suite.

A `.env.example` file shows the environment variables you may want to set.

The code is released under the MIT License (see [LICENSE](LICENSE)).

### Admin access

The admin panel is available at `/admin.html`.  You can log in with a user marked as admin.

If you don't yet have an admin account, register one via the special registration page:

```
http://localhost:3000/admin-register.html
```

For convenience the heart emoji in the header of every non‑admin page is clickable – it opens the admin panel in a new tab.  The icon is hidden on the admin login/registration pages.

New admin users are created with the `admin` flag set to true via the dedicated admin registration page; the main navigation no longer exposes an admin link. Alternatively you can promote an existing user in the database with:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin BOOLEAN DEFAULT false;
UPDATE users SET admin=true WHERE email='you@example.com';
```

### Getting started with GitHub

```bash
# initialize a git repository if you haven't already
cd quickmatch-connect-ultra
/git init
/git add .
/git commit -m "initial commit"

# create a remote GitHub repo and add it as origin, e.g.:
# git remote add origin git@github.com:<your-user>/quickmatch-connect-ultra.git
# git push -u origin main
```

Start API
```
cd api-server
npm install
npm run dev
```

Start socket server
```
cd socket-server
npm install
node socketServer.js
```

Start frontend
```
cd client
npm install
npm run dev
```

Open:
http://localhost:3000
