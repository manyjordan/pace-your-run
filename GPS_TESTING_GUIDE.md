# GPS Tracking Testing Guide

## Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- For mobile: GPS-enabled device (smartphone/tablet)
- GPS enabled on device

### Testing on Desktop (Chrome)

1. **Open DevTools**
   - Press `F12` or right-click → Inspect
   - Go to `More tools` → `Sensors`

2. **Enable Geolocation Emulation**
   - In Sensors panel, find "Emulate geolocation coordinates"
   - Select a location or custom coordinates

3. **Test Run Recording**
   - Go to Run page
   - Click Start button
   - Should see GPS accuracy indicator appear
   - Accuracy shows as ~10-50m in emulation

4. **Simulating Movement**
   - In Chrome DevTools Sensors:
     - Change latitude/longitude values
     - Each change simulates GPS update
     - Distance will increase for each ~5m movement

### Testing on Mobile (Real GPS)

1. **Enable Location Services**
   - Go to device Settings
   - Find app permissions for browser
   - Enable "Location" for your browser

2. **Start App**
   - Open browser and navigate to localhost:8080
   - Go to Run page

3. **Start Recording**
   - Click Start button
   - Grant location permission when prompted
   - You should see GPS accuracy display

4. **Go Running**
   - Start moving (walk or jog)
   - Distance accumulates in real-time
   - Pace updates as you run

5. **Stop Recording**
   - Click Stop button
   - See run summary with real stats
   - Run saved to Social tab

## Testing Scenarios

### Scenario 1: Permission Denied
**Goal**: Verify error handling

1. Start app on mobile
2. Click Start
3. When permission prompt appears, select "Deny"
4. **Expected**: 
   - Error message appears: "GPS non disponible. Activez la localisation..."
   - Run status returns to idle
   - Can't start new run without granting permission

### Scenario 2: Poor GPS Signal
**Goal**: Verify accuracy filtering

1. Start recording indoors or near buildings
2. **Expected**:
   - Accuracy dot is RED or YELLOW (> 10-30m)
   - Distance updates slowly or not at all
   - Message: "Signal GPS perdu" may appear

3. Move outside
   - Accuracy should improve (dot turns green)
   - Distance starts accumulating

### Scenario 3: Pause and Resume
**Goal**: Verify GPS tracking stops on pause

1. Start recording
2. After GPS points accumulated, click Pause
3. Walk around for 30 seconds
4. **Expected**: Distance stays same (GPS stopped)

5. Click Resume
6. Walk around
7. **Expected**: Distance resumes increasing

### Scenario 4: Stop Recording
**Goal**: Verify run summary

1. Start recording and accumulate GPS points
2. Walk/run at least 0.5 km
3. Click Stop
4. **Expected**:
   - Run summary card appears
   - Shows distance, duration, pace, elevation
   - Shows number of GPS points
   - Run appears in Social tab

### Scenario 5: Multiple Km Splits
**Goal**: Verify split calculation

1. Record a run with at least 2-3 km
2. **Expected**:
   - After reaching 1 km, "Splits" section shows up
   - Each 1 km has pace calculated from real GPS
   - Paces vary realistically (not all same)

## Chrome DevTools Testing

### Setting Custom GPS Points

In **Sensors** panel, set coordinates:

**Test Walk Simulation:**
```
Start: 48.8566, 2.3522 (Paris)
Step 1: 48.8570, 2.3522 (+~440m)
Step 2: 48.8575, 2.3522 (+~500m)
Step 3: 48.8580, 2.3522 (+~500m)
```

Distance should be ~1.4 km after 3 steps

### Accuracy Values to Test

```
High accuracy (Green): 5-8m
Medium accuracy (Yellow): 15-25m
Poor accuracy (Red): 40-60m
```

Change accuracy by modifying emulation settings.

## Debugging

### Check GPS Points
1. Open DevTools Console
2. Run: 
```javascript
// View stored runs
const runs = JSON.parse(localStorage.getItem('pace-community-posts'));
console.log(runs[0].gpsTrace); // Shows GPS points
```

### Monitor GPS Updates
In Console:
```javascript
let count = 0;
navigator.geolocation.watchPosition(
  (pos) => {
    console.log(`GPS ${++count}:`, pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
  },
  (err) => console.error("GPS Error:", err),
  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
);
```

### Check Haversine Calculation
```javascript
// In browser console, Run page should have this available
haversineDistance(48.8566, 2.3522, 48.8570, 2.3522); // Should be ~0.44 km
```

## Known Issues & Troubleshooting

### GPS Not Starting
**Problem**: Click Start but no GPS accuracy indicator

**Solutions**:
1. Check browser supports Geolocation (Chrome, Firefox, Safari, Edge)
2. On mobile, check location permission granted
3. On Safari iOS, requires HTTPS (use localhost on desktop)
4. Check DevTools console for error messages

### Distance Not Increasing
**Problem**: Moved but distance stays 0

**Solutions**:
1. Accuracy > 50m (too inaccurate) - move to open area
2. Moved < 5m since last point - need larger movement
3. First GPS point not yet acquired - wait a few seconds
4. Safari iOS on HTTPS issue

### Accuracy Always Red
**Problem**: GPS accuracy stuck at > 30m

**Solutions**:
1. Move to open area (away from buildings)
2. Wait 30 seconds for GPS lock
3. On Android, toggle location off/on
4. Check device has GPS (not all tablets have it)

### Browser DevTools Not Showing Sensors
**Problem**: Can't find Geolocation in DevTools

**Solutions**:
1. Chrome: Make sure using Chrome (not Chromium Edge)
2. Firefox: Use DevTools console instead with watchPosition()
3. Update browser to latest version
4. Clear cache and reload DevTools

## Performance Testing

### Measure GPS Update Frequency
```javascript
let lastTime = 0;
let updates = [];

navigator.geolocation.watchPosition((pos) => {
  const now = Date.now();
  const diff = now - lastTime;
  if (lastTime) updates.push(diff);
  lastTime = now;
  
  if (updates.length === 10) {
    const avg = updates.reduce((a, b) => a + b) / updates.length;
    console.log(`Average GPS update interval: ${avg.toFixed(0)}ms`);
    updates = [];
  }
});
```

**Expected**: ~1000ms (1 GPS update per second)

## Success Criteria

✅ **Test Passes When**:
- Permission prompt shows on Start
- GPS accuracy indicator displays (color changes as needed)
- Distance increases realistically when moving
- Pause stops distance accumulation
- Resume continues distance accumulation
- Stop shows summary with all stats
- Run appears in Social tab
- Splits show realistic pace per km
- Error messages appear when GPS fails
- Works on both desktop (emulated) and mobile (real GPS)

✅ **All Requirements Met**:
- Real GPS tracking works
- Haversine formula calculates distance
- Accuracy filtering ignores poor signals
- Elevation gain calculated from altitude
- Run summary complete and accurate
- Multiple user runs isolated (no mixing)
- iOS HTTPS requirement documented
- No new dependencies added

## Notes

- First GPS acquisition may take 5-30 seconds depending on device
- GPS is more accurate outside away from buildings
- Urban canyons can cause poor accuracy
- Device must have GPS hardware (most modern phones do)
- Battery drain is normal for continuous GPS tracking
