# Real GPS Tracking Implementation - Run.tsx

## Overview

The Run page now uses the browser's Geolocation API to provide real GPS tracking for running activities, replacing the previous simulated data. The implementation includes automatic distance calculation, GPS accuracy filtering, elevation gain tracking, and detailed run summaries.

## Key Features

### 1. Real GPS Tracking
- Uses `navigator.geolocation.watchPosition()` to continuously track user position
- Calculates real distance using the Haversine formula
- Filters GPS points for accuracy (ignores points with accuracy > 50m)
- Only adds new points when user has moved at least 5 meters (prevents GPS drift)
- Automatically pauses tracking when run is paused and resumes on play

### 2. Haversine Formula Distance Calculation
```typescript
function haversineDistance(lat1, lng1, lat2, lng2): number
```
Calculates the great-circle distance between two geographic coordinates. This is more accurate than simple Euclidean distance, especially for longer distances.

### 3. GPS Accuracy Indicator
Shows a colored dot next to Distance metric:
- 🟢 **Green**: accuracy < 10m (excellent)
- 🟡 **Yellow**: accuracy 10-30m (good)
- 🔴 **Red**: accuracy > 30m (poor or no signal)

### 4. Elevation Gain Tracking
- Uses GPS altitude data when available
- Calculates total elevation gain by summing all positive altitude changes
- Shows in run summary: "+X m"

### 5. Run Summary
After stopping, displays:
- Total distance (real GPS distance)
- Total duration (elapsed time)
- Average pace (min/km)
- Elevation gain (if altitude data available)
- Number of GPS points recorded

### 6. Real-time Splits
Shows pace for each kilometer based on actual GPS data, not simulation.

## Error Handling

### Permission Denied
If user denies location access:
- Shows error message: "GPS non disponible. Activez la localisation pour enregistrer votre course."
- Automatically stops the run

### GPS Signal Lost
- Shows warning: "Signal GPS perdu. Vérifiez que vous êtes à l'extérieur."
- Timer continues running
- Can resume tracking if signal returns

### Browser Not Supported
- Shows error: "GPS non disponible sur ce navigateur."
- Prevents starting a run

### Position Timeout
- Shows: "Délai d'attente GPS dépassé."
- Allows retry by starting a new run

## Technical Details

### GPS Watch Options
```typescript
{
  enableHighAccuracy: true,  // Request high accuracy
  timeout: 10000,            // 10 second timeout
  maximumAge: 0              // Don't use cached position
}
```

### Accuracy Filtering
- Points with accuracy > 50m are displayed but not added to distance calculation
- Prevents large GPS jumps from affecting distance
- User still sees the accuracy value

### Minimum Distance Between Points
- Only 5 meters minimum movement between GPS points
- Prevents false distance increases from GPS drift
- Maintains smooth distance tracking

### Altitude Handling
- Altitude is optional (may not be available on all devices)
- Only positive altitude changes count toward elevation gain
- Works on devices with barometric altimeter (most modern phones)

## iOS Considerations

**Important**: On iOS (Safari), Geolocation requires HTTPS or localhost.
- On production: Must serve app over HTTPS
- On development: Works with http://localhost:8080

Comment in code:
```typescript
// Note: On iOS (Safari), geolocation requires HTTPS
// This app must be served over HTTPS or from localhost for geolocation to work on iOS
```

## State Management

### New State Variables
- `gpsAccuracy`: Current GPS accuracy in meters
- `gpsError`: Error message if geolocation fails
- `runSummary`: Summary stats after run completes

### Refs
- `watchIdRef`: ID for GPS watch (used to clear watch)
- `lastGpsPointRef`: Last GPS point for distance calculation

## Usage Flow

1. **Start Run**
   - Clears previous run data
   - Requests GPS permission
   - Starts GPS tracking
   - Starts timer

2. **Running**
   - GPS points accumulate automatically
   - Distance updates in real-time
   - Accuracy indicator shows current GPS quality

3. **Pause**
   - Stops GPS tracking
   - Stops timer
   - Can resume later

4. **Stop**
   - Stops GPS tracking
   - Calculates final stats from real data
   - Shows run summary card
   - Saves run to localStorage

## Browser Compatibility

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✅ | ✅ | Full support |
| Firefox | ✅ | ✅ | Full support |
| Safari | ✅ | ⚠️ | iOS requires HTTPS |
| Edge | ✅ | ✅ | Full support |
| Safari iOS | ❌ | ⚠️ | HTTPS only |

## Testing

### On Desktop
1. Use Chrome DevTools to simulate GPS
2. DevTools → More tools → Sensors → Emulate geolocation
3. Enter latitude/longitude to simulate movement

### On Mobile
1. Open app on physical device with GPS enabled
2. Go outside for better signal
3. Start a run
4. Walk around to accumulate GPS points

### GPS Permission
- Prompt appears when user clicks Start
- User must grant location permission
- Permission persists for the session

## Performance

- GPS updates arrive ~1-2 times per second (browser dependent)
- Haversine calculation: <1ms per point
- Minimal battery impact with standard GPS options
- No external dependencies (uses native Geolocation API)

## Data Stored

Each run is saved to localStorage with:
- GPS trace (array of {lat, lng, time, altitude, accuracy})
- Distance (real, accumulated from GPS)
- Duration (elapsed time)
- Average pace (calculated)
- Elevation gain (from altitude if available)

Can be viewed in Social tab after recording.

## Future Enhancements

Possible improvements (without external dependencies):
- Route map visualization (could use leaflet which is already installed)
- Heart rate integration (needs device support)
- Pause/resume without GPS loss
- Offline GPS caching
- Export to GPX format
