#!/bin/bash

cd "$(dirname "$0")"

echo "🚀 Starting Toto BD Agent for Solcex Exchange..."
echo ""
echo "Agent: @theprincetoto"
echo "Creator: @dinozzolo"
echo "Company: Solcex Exchange (solcex.cc)"
echo ""

# Check if database exists, initialize if not
if [ ! -f "data/contacts.db" ]; then
  echo "📊 Initializing database..."
  mkdir -p data
fi

echo "✅ Starting agent..."
echo ""

npm start
