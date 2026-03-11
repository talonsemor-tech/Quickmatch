
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
