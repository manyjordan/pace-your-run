# Capacitor Deployment Checklist

## Pre-Build Steps

✅ Install Capacitor CLI (if not already installed)
```bash
npm install -g @capacitor/cli
```

✅ Install native platforms (if not already done)
```bash
npx cap add ios
npx cap add android
```

✅ Dependencies already installed:
- `@capacitor/splash-screen`
- `@capacitor/core`

## Build & Sync Process

### Step 1: Build the Web App
```bash
npm run build
```
This creates the `dist/` folder with the compiled React app.

### Step 2: Sync to Native Platforms
```bash
# For iOS
npx cap sync ios

# For Android
npx cap sync android
```

This copies the web build and native plugins to the iOS/Android projects.

## iOS Setup

### Step 3a: Open Xcode
```bash
npx cap open ios
```

### Step 3b: Add App Icons
See `ICON_SETUP.md` for detailed Xcode instructions.

**Quick version:**
1. In Xcode, select Assets.xcassets → AppIcon
2. Drag icons from `Downloads/AppIcons_extracted/Assets.xcassets/AppIcon.appiconset/`
3. Match each icon to its slot (see table in ICON_SETUP.md)

### Step 4: Build & Run
```bash
# From terminal (in ios/ directory)
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release

# Or use Xcode GUI:
# Select target device/simulator → Click Run (Cmd+R)
```

### Step 5: Verify on Device/Simulator
- App should show splash screen for 2 seconds on launch
- App icon should appear on home screen
- Icon should be visible in home screen app grid

## Android Setup

### Step 3 (Android): Open Android Studio
```bash
npx cap open android
```

### Step 4: Add App Icons
Copy icons to the appropriate densities:
```bash
cp Downloads/AppIcons_extracted/android/mipmap-*/Pace.png \
   android/app/src/main/res/mipmap-*/ic_launcher.png
```

Update `android/app/src/main/AndroidManifest.xml`:
```xml
<application
  android:icon="@mipmap/ic_launcher"
  android:roundIcon="@mipmap/ic_launcher_round"
  ...>
```

### Step 5: Build & Run
```bash
# From Android Studio or terminal
./gradlew build
./gradlew installDebug
```

## App Store Submission (iOS)

### Requirements Checklist
- [ ] App icon 1024×1024 PNG is set
- [ ] Splash screen configured with correct timing
- [ ] All icon slots in AppIcon set are populated
- [ ] Bundle ID matches provisioning profile
- [ ] Signing certificate is valid
- [ ] Privacy Policy URL added (from `/privacy`)
- [ ] Terms of Use URL added (from `/terms`)
- [ ] App description and screenshots added
- [ ] Minimum iOS version set (recommended: iOS 14+)

### App Store Connect Upload
1. In Xcode: Product → Archive
2. Click "Distribute App"
3. Select "App Store Connect"
4. Follow the wizard
5. In App Store Connect, complete app information
6. Submit for review

## Testing Locally Before Submission

### iOS Simulator
```bash
npm run build
npx cap sync ios
npx cap open ios
# In Xcode: Select iPhone simulator → Run (Cmd+R)
```

### iOS Device (via USB)
```bash
npm run build
npx cap sync ios
npx cap open ios
# In Xcode: Select your device → Run (Cmd+R)
# Trust the developer certificate when prompted
```

### Test Checklist
- [ ] Splash screen shows for 2 seconds
- [ ] App loads after splash screen
- [ ] All navigation works
- [ ] GPS/Bluetooth permissions can be granted
- [ ] Photos/Health app permissions work
- [ ] Settings page accessible
- [ ] Account deletion works (delete test user after)
- [ ] Sign out works

## Environment Variables

Ensure `.env` file is in the root with:
```
VITE_SUPABASE_URL=https://qdimcdoglkeigimrdpsb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkaW1jZG9nbGtlaWdpbXJkcHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI1NTIsImV4cCI6MjA5MDQ2ODU1Mn0.BpJLQN_fj50uFy0SmMHdvFbeH87N6jELu0nnlNTLlb0
```

These are embedded in the production build.

## Troubleshooting

### "iOS deployment target" error
```bash
# In Xcode, set minimum deployment target:
# Targets → Build Settings → iOS Deployment Target → 14.0 (or higher)
```

### Splash screen not appearing on device
- Verify `capacitor.config.ts` exists
- Run `npx cap sync ios` again
- Delete app from device and reinstall

### Icons still old after deployment
- Clear Xcode derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
- Delete app from simulator/device
- Rebuild with `npx cap sync ios`

### App crashes on startup
- Check iOS console in Xcode: Window → Devices and Simulators
- Look for error messages
- Verify all permissions in Info.plist

## Documentation

- See `ICON_SETUP.md` for detailed Xcode icon setup
- See `SPLASH_ICONS_SETUP.md` for quick reference
- See `README.md` for general app info

## Build Artifacts

After successful build:
- iOS build: `ios/App/Pods/` + `ios/App/App.xcworkspace/`
- Android build: `android/app/build/`
- Web build: `dist/`

All three can be version controlled or uploaded to CI/CD.

## Next Steps

1. ✅ App icons set up
2. ✅ Splash screen implemented
3. ✅ Capacitor configured
4. Next: Run `npm run build && npx cap sync ios`
5. Next: Open Xcode and add icons
6. Next: Test on simulator
7. Next: Test on actual device
8. Next: Submit to App Store

---

**Questions?** See `ICON_SETUP.md` or refer to:
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/getting-started/environment-setup)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
