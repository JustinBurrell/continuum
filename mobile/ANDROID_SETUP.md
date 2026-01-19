# Android Development Setup

## Environment Variables
Android SDK environment variables have been configured in `~/.zshrc`:
- `ANDROID_HOME`: Points to Android SDK location
- `PATH`: Includes emulator, platform-tools, and tools

**Note**: You may need to restart your terminal or run `source ~/.zshrc` for changes to take effect.

## Available AVD
- **Pixel_2_API_33**: Android 13 (API 33) on Pixel 2 device

## Starting Android Emulator

### Option 1: Use the convenience script (Recommended) ⭐
```bash
cd mobile

# Start emulator only
npm run emulator

# Or start emulator and Expo together
npm run android:dev
```

You can also run the script directly:
```bash
cd mobile
./start-android-emulator.sh
# Or specify a different AVD
./start-android-emulator.sh Pixel_2_API_33
```

The script will:
- Check if an emulator is already running
- List available AVDs
- Start the specified emulator (default: Pixel_2_API_33)
- Wait for it to boot and confirm it's ready

### Option 2: Start emulator manually, then run Expo
```bash
# Start emulator
~/Library/Android/sdk/emulator/emulator -avd Pixel_2_API_33

# In another terminal, start Expo
cd mobile
npm start
# Then press 'a' to open on Android
```

### Option 3: Let Expo start the emulator automatically
```bash
cd mobile
npm start
# Press 'a' - Expo will attempt to start an emulator if none is running
```

### Option 4: Start emulator from Android Studio
1. Open Android Studio
2. Go to Tools > Device Manager
3. Click the play button next to "Pixel_2_API_33"

## Verifying Setup
```bash
# Check if ADB can see devices
adb devices

# List available AVDs
~/Library/Android/sdk/emulator/emulator -list-avds
```

## Troubleshooting

### Expo can't find Android emulator
1. Make sure emulator is running: `adb devices`
2. Verify ANDROID_HOME is set: `echo $ANDROID_HOME`
3. Restart terminal or run `source ~/.zshrc`

### Creating a new AVD
1. Open Android Studio
2. Go to Tools > Device Manager
3. Click "Create Device"
4. Choose device (e.g., Pixel 5)
5. Choose system image (recommended: API 33 or 34)
6. Finish setup

## For Production Builds
When ready for Google Play deployment, you'll need to:
1. Generate a signing key
2. Configure `app.json` with build settings
3. Use EAS Build for production builds

See Expo documentation for production build setup.
