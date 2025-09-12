# Yatra Suraksha Backend

## Setup

1. `npm install`
2. Create `.env` from `.env.sample`
3. Start MongoDB:
   ```bash
   docker pull mongodb/mongodb-community-server:latest
   docker run --name mongodb -p 27017:27017 -d mongodb/mongodb-community-server:latest
   ```
4. `npm run dev`

