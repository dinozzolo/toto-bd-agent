#!/bin/bash
# Monitor for successful DM and alert Dino

LOG_FILE="/root/.openclaw/workspace/bd-agent/toto.log"
LAST_CHECK_FILE="/tmp/last_dm_check"

# Get last line number checked
LAST_LINE=0
if [ -f "$LAST_CHECK_FILE" ]; then
    LAST_LINE=$(cat "$LAST_CHECK_FILE")
fi

# Count total lines
TOTAL_LINES=$(wc -l < "$LOG_FILE")

# Check new lines for DM success
if [ "$TOTAL_LINES" -gt "$LAST_LINE" ]; then
    # Check for DM success in new lines
    DM_SUCCESS=$(tail -n +$((LAST_LINE + 1)) "$LOG_FILE" | grep "DM sent to" | head -1)
    
    if [ ! -z "$DM_SUCCESS" ]; then
        # Extract project name
        PROJECT=$(echo "$DM_SUCCESS" | grep -oP 'DM sent to \K[^ ]+')
        
        # Send alert via Telegram
        curl -s -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
            -d "chat_id=1563799449" \
            -d "text=✅ First DM SUCCESS! Sent to $PROJECT" \
            > /dev/null 2>&1
        
        # Disable this script after first success
        rm -f /tmp/dm_monitor_cron
        crontab -l | grep -v "dm_monitor.sh" | crontab -
    fi
fi

# Save current line count
echo "$TOTAL_LINES" > "$LAST_CHECK_FILE"
