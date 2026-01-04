#!/bin/bash

# Setup script for Invoice Reconciliation API

echo "Setting up Invoice Reconciliation API..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "Error: PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Create database if it doesn't exist
echo "Creating database..."
createdb invoice_reconciliation 2>/dev/null || echo "Database already exists or error occurred"

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Generate Drizzle migrations
echo "Generating Drizzle migrations..."
npm run db:generate

# Run migrations
echo "Running database migrations..."
npm run db:migrate

# Set up RLS policies
echo "Setting up RLS policies..."
psql invoice_reconciliation -f src/database/rls-setup.sql

# Setup Python environment
echo "Setting up Python environment..."
cd python
if [ ! -d "venv" ]; then
    python3.13 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ..

echo "Setup complete!"
echo ""
echo "To start the NestJS server: npm run start:dev"
echo "To start the Python server: cd python && python -m app.main"
echo ""
echo "Don't forget to:"
echo "1. Copy .env.example to .env and configure it"
echo "2. Set up your JWT_SECRET"
echo "3. (Optional) Add OPENAI_API_KEY for AI explanations"

