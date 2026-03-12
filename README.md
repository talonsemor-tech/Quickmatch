
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

## Run locally

Start infrastructure
```
docker compose up -d
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
npm run dev
```

Start frontend
```
cd client
npm install
npm run dev
```

Open:
http://localhost:3000

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
