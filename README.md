# gc/bc

You deserve a good company; gc/bc will help you find it. Vibe coded with ❤️, React, and Node.js.

## Features

- 📊 Interactive timeline visualization of review ratings
- 📈 Sentiment analysis charts
- 📋 Advanced filtering and sorting of reviews
- 💾 CSV export functionality
- 🏢 Company management system
- 📱 Responsive design

## Tech Stack

- Frontend:
  - React 18
  - Vite
  - TailwindCSS
  - Recharts
  - React Table

- Backend:
  - Node.js
  - Express

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/markdstafford/gc-bc.git
cd gc-bc
```

2. Install dependencies:
   ```bash
# Install backend dependencies
cd server
   npm install

# Install frontend dependencies
cd ../client
npm install
   ```

3. Set up environment variables:
```bash
# In server directory
cp .env.example .env
```

4. Start the development servers:
```bash
# Start backend (in server directory)
npm run dev

# Start frontend (in client directory)
npm run dev
```

## Deployment

The application is configured for deployment on Render.com. Required environment variables:

- `NODE_ENV`: Set to "production"

## License

MIT License 