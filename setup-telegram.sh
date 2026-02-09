#!/bin/bash

# Telegram Setup Script for Toto BD Agent
# This script installs dependencies and sets up Telegram authentication

echo "🔧 Toto BD Agent - Telegram Setup"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the bd-agent directory"
    exit 1
fi

echo "📦 Installing Telegram dependencies..."
npm install telegram input --save

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "🔐 Next step: Authenticate with Telegram"
echo "   Run: node src/telegram-auth.js"
echo ""
echo "📋 What will happen:"
echo "   1. You'll be prompted for the verification code"
echo "   2. Check your Telegram app (@dinozzolo) for the code"
echo "   3. Enter the 5-digit code in the terminal"
echo "   4. Session will be saved automatically"
echo ""
echo "🚀 After authentication, Toto can:"
echo "   • Join project Telegram groups (max 10/day)"
echo "   • Send BD outreach messages"
echo "   • Track responses automatically"
echo ""
