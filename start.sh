#!/bin/bash
# ============================================
# PinAutoFlow — Start Script
# ============================================

echo ""
echo "📌 Starting PinAutoFlow..."
echo ""

# Check if .env exists
if [ ! -f "backend/.env" ]; then
  echo "⚠️  No .env file found!"
  echo "   Copy backend/.env.example to backend/.env and fill in your keys."
  echo "   See README.md Step 3 for instructions."
  echo ""
fi

# Check if node_modules exists
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing dependencies..."
  cd backend && npm install
  cd ..
fi

echo "🚀 Starting backend server on http://localhost:3001"
echo "   Press Ctrl+C to stop."
echo ""

cd backend && node server.js
