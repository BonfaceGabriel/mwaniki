#!/bin/bash

echo "🕊️  Memorial Site - Local Setup Script"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

echo ""
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check for environment files
if [ ! -f .env.local ]; then
    echo "⚠️  Frontend .env.local not found. Creating from example..."
    cp .env.local.example .env.local
    echo "📝 Please edit .env.local with your settings"
fi

if [ ! -f server/.env ]; then
    echo "⚠️  Backend .env not found. Creating from example..."
    cp server/.env.local.example server/.env
    echo "📝 Please edit server/.env with your database and Supabase credentials"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Edit .env.local:"
echo "   - Set VITE_API_BASE_URL=http://localhost:3001"
echo ""
echo "2. Edit server/.env:"
echo "   - Get DATABASE_URL from Neon/Supabase"
echo "   - Get SUPABASE_URL and SUPABASE_SERVICE_KEY from Supabase"
echo "   - Set JWT_SECRET to a random string"
echo "   - Set ADMIN credentials"
echo ""
echo "3. Initialize database:"
echo "   cd server"
echo "   node db.js"
echo "   node migrations/001_add_admin_user.js"
echo "   cd .."
echo ""
echo "4. Start development servers:"
echo "   Terminal 1: cd server && npm start"
echo "   Terminal 2: npm run dev"
echo ""
echo "5. Open http://localhost:8080"
echo ""
echo "📖 For more details, see SETUP.md"
echo ""
echo "✨ Happy customizing! 🕊️"
