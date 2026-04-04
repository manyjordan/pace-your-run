# App Icons & Splash Screen Setup

## What's Been Done

### 1. Web Assets
✅ **Favicon** (`public/favicon.png`) - 32×32 PNG for browser tabs
✅ **Apple Touch Icon** (`public/apple-touch-icon.png`) - 180×180 PNG for iOS home screen
✅ **Meta tags** in `index.html` - iOS web app configuration

### 2. React Splash Screen
✅ **Component** (`src/components/SplashScreen.tsx`)
   - Shows for exactly 2 seconds on first app load
   - Displays "Pace" logo with animations
   - Lime green accent line animation
   - Uses `sessionStorage` to show only on first load per session

✅ **Integrated in App.tsx**
   - Splash screen shows before routing
   - Automatically hidden after 2 seconds
   - Won't show on page refresh (within same session)

### 3. Capacitor Configuration
✅ **capacitor.config.ts** - Native splash screen configuration
   - Shows for 2 seconds
   - Dark background (#0a0a0a)
   - No spinner (clean look)

✅ **@capacitor/splash-screen** - Installed via npm

## Next Steps for iOS Build

### Option A: Using Capacitor Sync (Recommended)
```bash
# After generating icons with appicon.co
npm run build
npx cap sync ios
npx cap open ios
```

Xcode will open. Then:

1. In **Assets.xcassets**, select **AppIcon**
2. For each icon slot, drag the corresponding PNG from:
   ```
   Downloads/AppIcons_extracted/Assets.xcassets/AppIcon.appiconset/
   ```
3. Build and run (Cmd+R)

### Option B: Direct File Copy
```bash
# Copy all icons
cp Downloads/AppIcons_extracted/Assets.xcassets/AppIcon.appiconset/*.png \
   ios/App/App/Assets.xcassets/AppIcon.appiconset/

# Copy the Contents.json that maps them
cp Downloads/AppIcons_extracted/Assets.xcassets/AppIcon.appiconset/Contents.json \
   ios/App/App/Assets.xcassets/AppIcon.appiconset/

# Refresh in Xcode and build
```

## Icon Files Reference

All icons available in: `Downloads/AppIcons_extracted/Assets.xcassets/AppIcon.appiconset/`

**Key sizes:**
- 1024.png → App Store
- 180.png → iPhone home screen (3x)
- 167.png → iPad Pro
- 152.png → iPad
- 120.png → iPhone home screen (2x)

## Testing

### Web
```bash
npm run dev
# Splash shows for 2 seconds on first load
# Refresh: splash won't show (sessionStorage flag)
```

### iOS Simulator
```bash
npm run build
npx cap sync ios
npx cap open ios
# Xcode opens - click Run (Cmd+R)
# Native splash screen shows
# App icons appear on home screen
```

## Files Modified/Created

| File | Status |
|------|--------|
| `public/favicon.png` | ✅ Created |
| `public/apple-touch-icon.png` | ✅ Created |
| `index.html` | ✅ Updated (meta tags) |
| `src/components/SplashScreen.tsx` | ✅ Created |
| `src/App.tsx` | ✅ Updated (splash screen logic) |
| `capacitor.config.ts` | ✅ Created |
| `ICON_SETUP.md` | ✅ Created (detailed instructions) |
| `package.json` | ✅ Updated (@capacitor/splash-screen added) |

## Important Notes

1. **Splash Screen Behavior**
   - Shows only on first load (per session)
   - Uses `sessionStorage` to track state
   - Automatically hides after 2 seconds
   - No user interaction needed

2. **Icon Sizes**
   - Must use exact sizes provided by appicon.co
   - iOS requires 8-bit PNG for most slots
   - Provide 1x, 2x, 3x variants as needed

3. **App Store Requirements**
   - 1024×1024 PNG required for App Store submission
   - All icon slots must be filled
   - No transparency for app icon (can have for others)

## Troubleshooting

**Icons not showing in Xcode:**
```bash
# Clear Xcode cache
rm -rf ~/Library/Developer/Xcode/DerivedData/*
# Restart Xcode
```

**Splash screen not showing:**
- Verify `capacitor.config.ts` settings
- Run `npx cap sync ios` after any config changes
- Check iOS console in Xcode

**Icons blurry on device:**
- Ensure each icon is the exact required size
- Use PNG format (not JPEG)
- Test on actual device (simulator may cache old icons)

## Resources

- **[Capacitor SplashScreen Plugin](https://capacitorjs.com/docs/apis/splash-screen)**
- **[Capacitor Deployment](https://capacitorjs.com/docs/basics/deploying-to-ios)**
- **[App Icon Generator](https://appicon.co/)**
- **[iOS App Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)**

---

For detailed Xcode instructions, see `ICON_SETUP.md`
