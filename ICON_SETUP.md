# iOS App Icon & Splash Screen Setup Guide

## Overview
This guide explains how to set up app icons and splash screens for the iOS build of Pace.

## Part 1: Native Splash Screen (Capacitor)

The splash screen is automatically handled by Capacitor using the configuration in `capacitor.config.ts`:
```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,        // Show for 2 seconds
    launchAutoHide: true,             // Auto-hide after duration
    backgroundColor: '#0a0a0a',       // Dark background
    showSpinner: false                // No loading spinner
  }
}
```

**To deploy:**
```bash
npm run build
npx cap sync ios
```

## Part 2: App Icons in Xcode

The generated icon files are located in:
```
AppIcons/Assets.xcassets/AppIcon.appiconset/
```

### Files & Their Uses

| File | Size | Usage |
|------|------|-------|
| 1024.png | 1024×1024 | App Store |
| 512.png | 512×512 | Larger devices |
| 256.png | 256×256 | Spotlight |
| 180.png | 180×180 | iPhone home screen (3x) |
| 167.png | 167×167 | iPad Pro (iPad 12.9") |
| 152.png | 152×152 | iPad (iPad 2, 3, mini) |
| 120.png | 120×120 | iPhone home screen (2x) |
| 87.png | 87×87 | Spotlight iOS |
| 58.png | 58×58 | Settings iOS |
| 29.png | 29×29 | Settings iPhone |
| 16.png | 16×16 | Favicon |

### Steps to Add Icons to Xcode

1. **Open Xcode project:**
   ```bash
   npx cap open ios
   ```

2. **In Xcode, navigate to:**
   - Project Navigator (left panel) → Select "Pace"
   - Target "Pace"
   - Click "Build Settings" tab
   - Look for "App Icons and Launch Images"

3. **Navigate to Assets Catalog:**
   - Click "Assets.xcassets" in the Project Navigator
   - Select "AppIcon" in the middle panel

4. **Drag & Drop Icons:**
   - Download the icon set from `Downloads/AppIcons_extracted/Assets.xcassets/AppIcon.appiconset/`
   - In Xcode, for each slot (iPhone Notification 20pt, iPhone App 60pt, etc.), drag the corresponding PNG file
   
   **Quick mapping for iOS:**
   - **iPhone Notification 20pt (1x)** → 20.png
   - **iPhone Notification 20pt (2x)** → 40.png
   - **iPhone Notification 20pt (3x)** → 60.png
   - **iPhone App 60pt (2x)** → 120.png
   - **iPhone App 60pt (3x)** → 180.png
   - **iPad App 76pt (1x)** → 76.png
   - **iPad App 76pt (2x)** → 152.png
   - **iPad Pro App 83.5pt (2x)** → 167.png
   - **App Store 1024pt** → 1024.png

5. **Verify in Contents.json:**
   - Xcode auto-generates a `Contents.json` file that maps each icon
   - Verify all slots are filled with correct icon sizes

### Alternative: Direct File Replacement

If dragging doesn't work:

1. **Locate the Xcode project:**
   ```
   ios/App/App/Assets.xcassets/AppIcon.appiconset/
   ```

2. **Copy all PNG files from the generated icon set:**
   ```bash
   cp Downloads/AppIcons_extracted/Assets.xcassets/AppIcon.appiconset/*.png \
      ios/App/App/Assets.xcassets/AppIcon.appiconset/
   ```

3. **Update `Contents.json`:**
   - Replace with the generated `Contents.json` from the icon set:
   ```bash
   cp Downloads/AppIcons_extracted/Assets.xcassets/AppIcon.appiconset/Contents.json \
      ios/App/App/Assets.xcassets/AppIcon.appiconset/
   ```

4. **Refresh Xcode:**
   - File → Revert to Saved
   - Or close and reopen the project

## Part 3: Android Icons

Android icons should be placed in:
```
android/app/src/main/res/mipmap-*/
```

The generated icons are at:
```
AppIcons/android/mipmap-*/Pace.png
```

Copy them to the project:
```bash
# For each density
cp Downloads/AppIcons_extracted/android/mipmap-hdpi/Pace.png \
   android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp Downloads/AppIcons_extracted/android/mipmap-mdpi/Pace.png \
   android/app/src/main/res/mipmap-mdpi/ic_launcher.png
# ... etc for xhdpi, xxhdpi, xxxhdpi
```

Update `android/app/src/main/AndroidManifest.xml`:
```xml
<application
  android:icon="@mipmap/ic_launcher"
  android:roundIcon="@mipmap/ic_launcher_round"
  ...>
```

## Part 4: Web Assets

Already configured in `public/`:
- `favicon.png` (32×32) - Browser tab icon
- `apple-touch-icon.png` (180×180) - iOS home screen shortcut

Referenced in `index.html`:
```html
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Pace">
<meta name="theme-color" content="#0a0a0a">
```

## Part 5: React Splash Screen

A custom React splash screen component is in `src/components/SplashScreen.tsx`:
- Shows for exactly 2 seconds
- Displays "Pace" logo with fade-in animation
- Lime green accent line animation
- Automatically hides on first app load (sessionStorage tracks this)

## Testing

### On Web
```bash
npm run dev
# Splash screen shows for 2 seconds on first load
# Refresh page: splash screen won't show (sessionStorage has flag)
```

### On iOS Simulator
```bash
npm run build
npx cap sync ios
npx cap open ios
# Xcode opens the iOS project
# Click "Run" to build and test on simulator
# Native splash screen shows for 2 seconds
# App icons appear on home screen
```

### On iOS Device
1. Connect device via USB
2. Select device in Xcode
3. Click "Run"
4. Wait for build to complete
5. Icons appear on home screen after installation

## Troubleshooting

### Icons not showing in Xcode
- Make sure files are 8-bit PNG (no alpha channel for some iOS slots)
- Clear Xcode cache: Cmd+Shift+K
- Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
- Restart Xcode

### Splash screen not appearing
- Verify `capacitor.config.ts` has correct `launchShowDuration`
- Run `npx cap sync ios` after config changes
- Check iOS console logs: Xcode → Window → Devices and Simulators

### Icons appear blurry or wrong size
- Verify each icon matches its intended size (see table above)
- Test with 1x, 2x, 3x density variants
- Use vector source when possible (SVG to PNG conversion)

## Resources

- [Capacitor SplashScreen Plugin](https://capacitorjs.com/docs/apis/splash-screen)
- [Capacitor App Plugin](https://capacitorjs.com/docs/apis/app)
- [Apple App Icon Specifications](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [iOS App Icon Generator](https://appicon.co/)
