#!/bin/bash

# ERP System Quick Start Script
# Run this script to setup everything from scratch

set -e

echo "🚀 Starting ERP System Setup..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

echo "📁 Current directory: $(pwd)"

# Copy environment file if not exists
if [ ! -f devops/.env ]; then
    echo "📝 Creating .env file..."
    cp devops/.env.example devops/.env

    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')

    # Update .env with generated secrets
    sed -i "s/your_secure_database_password_here/$DB_PASSWORD/g" devops/.env
    sed -i "s/your_jwt_secret_minimum_32_characters_long_change_this/$JWT_SECRET/g" devops/.env

    echo "✅ .env file created with random secrets"
else
    echo "✅ .env file already exists"
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
cd devops
docker-compose up -d

echo "⏳ Waiting for database to be ready..."
sleep 15

# Run database migrations
echo "🗄️ Running database migrations..."
docker exec erp_backend npm run migrate || echo "⚠️ Migration warning (might be already applied)"

# Create test users
echo "👤 Creating test users..."
docker exec erp_backend node scripts/seed-data.js || echo "⚠️ Seed warning (users might already exist)"

# Check status
echo ""
echo "🎉 Setup complete!"
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Access URLs:"
echo "  Frontend: http://localhost:5000"
echo "  Backend API: http://localhost:5001"
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"

echo ""
echo "👤 Test Users:"
echo "  Admin:   admin@erp.local / admin123"
echo "  Manager: manager@erp.local / manager123"
echo "  User:    user@erp.local / user123"

echo ""
echo "📝 View logs:"
echo "  docker-compose logs -f backend"

echo ""
echo "🛑 Stop services:"
echo "  docker-compose down"

echo ""
echo "✅ All done! You can now login at http://localhost:5000"
