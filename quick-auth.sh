#!/bin/bash
# Quick Telegram auth with minimal latency

cd /root/.openclaw/workspace/bd-agent

echo "========================================"
echo "TELEGRAM AUTH - FAST ENTRY REQUIRED!"
echo "========================================"
echo ""
echo "When you see 'Enter code:' below:"
echo "1. Check Telegram for the 5-digit code"
echo "2. Type it IMMEDIATELY and press Enter"
echo "3. You have only 2 minutes!"
echo ""
echo "Press Enter to start..."
read

echo "Starting..."
node src/telegram-auth.js
