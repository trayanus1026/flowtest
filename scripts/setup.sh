echo "Setting up Invoice Reconciliation API..."

if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "Error: PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

echo "Creating database..."
createdb flowtest 2>/dev/null || echo "Database already exists or error occurred"

echo "Installing Node.js dependencies..."
npm install

echo "Generating Drizzle migrations..."
npm run db:generate

echo "Running database migrations..."
npm run db:migrate

echo "Setting up RLS policies..."
psql flowtest -f src/database/rls-setup.sql

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
echo "2. Set up JWT_SECRET in .env"
echo "3. (Optional) Add OPENAI_API_KEY for AI explanations"

