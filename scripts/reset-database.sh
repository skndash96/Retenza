#!/bin/bash

# Database Reset Script
# This script completely drops and recreates the database

echo "🗑️  Resetting database..."

# Get database name from environment or use default
DB_NAME=${DATABASE_NAME:-retenza}
DB_USER=${DATABASE_USER:-postgres}
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}

echo "📊 Database: $DB_NAME"
echo "👤 User: $DB_USER"
echo "🌐 Host: $DB_HOST:$DB_PORT"

# Drop database if it exists
echo "🗑️  Dropping database if it exists..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"

# Create fresh database
echo "✨ Creating fresh database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE \"$DB_NAME\";"

# Run initial schema migration
echo "🏗️  Running initial schema migration..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f drizzle/0001_initial_schema.sql

# Run seed data migration (optional)
read -p "🤔 Do you want to add sample data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Adding sample data..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f drizzle/0002_seed_data.sql
    echo "✅ Sample data added!"
else
    echo "⏭️  Skipping sample data"
fi

echo "🎉 Database reset complete!"
echo "📊 You can now run: pnpm db:studio" 