#!/bin/bash

# Script to start Android emulator
# Usage: ./start-android-emulator.sh [avd-name]

ANDROID_SDK="$HOME/Library/Android/sdk"
EMULATOR="$ANDROID_SDK/emulator/emulator"

# Check if emulator exists
if [ ! -f "$EMULATOR" ]; then
    echo "❌ Error: Android emulator not found at $EMULATOR"
    echo "Please make sure Android SDK is installed and ANDROID_HOME is set."
    exit 1
fi

# Check if an emulator is already running
if adb devices | grep -q "emulator"; then
    echo "✅ Android emulator is already running!"
    adb devices
    exit 0
fi

# Get AVD name from argument or use default
AVD_NAME="${1:-Pixel_2_API_33}"

# List available AVDs
echo "📱 Available Android Virtual Devices:"
$EMULATOR -list-avds
echo ""

# Check if specified AVD exists
if ! $EMULATOR -list-avds | grep -q "^$AVD_NAME$"; then
    echo "❌ Error: AVD '$AVD_NAME' not found!"
    echo ""
    echo "Available AVDs:"
    $EMULATOR -list-avds
    exit 1
fi

# Start the emulator
echo "🚀 Starting Android emulator: $AVD_NAME"
echo "⏳ This may take a minute..."
echo ""

# Start emulator in background
$EMULATOR -avd "$AVD_NAME" > /dev/null 2>&1 &

# Wait for emulator to boot
echo "⏳ Waiting for emulator to boot..."
sleep 5

# Check if emulator is starting up
MAX_WAIT=60
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if adb devices | grep -q "emulator.*device"; then
        echo "✅ Android emulator is ready!"
        adb devices
        exit 0
    elif adb devices | grep -q "emulator.*offline"; then
        echo "⏳ Emulator is booting... (offline)"
    fi
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
done

echo "⚠️  Emulator is starting but may not be fully ready yet."
echo "Run 'adb devices' to check status."
adb devices
