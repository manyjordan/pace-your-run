import { Capacitor } from "@capacitor/core";
import type { ImportedRun } from "@/lib/parsers/gpxParser";

// Track if HealthKit observer is active
let isObserving = false;
let heartRateCallback: ((bpm: number) => void) | null = null;
let HealthKit: any = null;

/**
 * Lazy load HealthKit module only when needed
 */
async function getHealthKit(): Promise<any> {
  if (HealthKit !== null) {
    return HealthKit;
  }

  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
    return null;
  }

  try {
    // Dynamically import only on native iOS
    const module = await import("@perfood/capacitor-healthkit");
    HealthKit = module.HealthKit;
    return HealthKit;
  } catch (e) {
    console.warn("HealthKit module not available:", e);
    return null;
  }
}

/**
 * Check if HealthKit is available (iOS native only)
 */
export function isHealthKitAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

/**
 * Request HealthKit permissions for running data and heart rate
 */
export async function requestHealthKitPermissions(): Promise<boolean> {
  const hk = await getHealthKit();
  if (!hk) {
    return false;
  }

  try {
    const result = await hk.requestAuthorization({
      permissions: {
        read: [
          "HKWorkoutTypeIdentifier",
          "HKQuantityTypeIdentifierDistanceWalkingRunning",
          "HKQuantityTypeIdentifierHeartRate",
          "HKQuantityTypeIdentifierActiveEnergyBurned",
        ],
      },
    });

    return result && result.success === true;
  } catch (error) {
    console.error("Error requesting HealthKit permissions:", error);
    return false;
  }
}

/**
 * Fetch recent running workouts from HealthKit
 */
export async function fetchRecentRuns(limit: number = 200): Promise<ImportedRun[]> {
  const hk = await getHealthKit();
  if (!hk) {
    return [];
  }

  try {
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const result = await hk.getWorkoutSamples({
      startDate: oneYearAgo,
      endDate: now,
      limit: limit,
    });

    if (!result || !result.samples) {
      return [];
    }

    // Convert HealthKit workouts to ImportedRun format
    const runs: ImportedRun[] = result.samples
      .filter((workout: any) => {
        // Filter for running workouts only
        return workout.workoutActivityType === 1; // 1 = Running in HealthKit
      })
      .map((workout: any) => {
        const startDate = new Date(workout.startDate);
        const endDate = new Date(workout.endDate);
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationMinutes = durationMs / (1000 * 60);
        const distance = (workout.totalEnergyBurned || 0) / 1000;

        return {
          name: workout.name || `Course - ${startDate.toLocaleDateString("fr-FR")}`,
          distance: distance,
          duration: durationMinutes,
          pace: durationMinutes > 0 && distance > 0 ? (durationMinutes / distance) * 60 : 0,
          elevationGain: workout.totalFlightsClimbed ? workout.totalFlightsClimbed * 3.048 : 0,
          gpsTrace: [],
          heartRate: workout.averageHeartRate || 0,
          source: "HealthKit",
          started_at: startDate.toISOString(),
          date: startDate,
        } as ImportedRun;
      })
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    return runs;
  } catch (error) {
    console.error("Error fetching HealthKit workouts:", error);
    return [];
  }
}

/**
 * Start observing live heart rate from Apple Watch
 */
export async function startLiveHeartRate(callback: (bpm: number) => void): Promise<void> {
  const hk = await getHealthKit();
  if (!hk || isObserving) {
    return;
  }

  try {
    heartRateCallback = callback;
    isObserving = true;

    // Start observing heart rate changes
    await hk.monitorHeartRateSamples({
      interval: 1000,
      onSampleReceived: (sample: any) => {
        if (heartRateCallback && sample.value) {
          heartRateCallback(Math.round(sample.value));
        }
      },
      onError: (error: any) => {
        console.error("Error observing heart rate:", error);
        isObserving = false;
        heartRateCallback = null;
      },
    });
  } catch (error) {
    console.error("Error starting HealthKit heart rate observation:", error);
    isObserving = false;
    heartRateCallback = null;
  }
}

/**
 * Stop observing live heart rate
 */
export async function stopLiveHeartRate(): Promise<void> {
  const hk = await getHealthKit();
  if (!hk || !isObserving) {
    return;
  }

  try {
    await hk.stopHeartRateObservation();
    isObserving = false;
    heartRateCallback = null;
  } catch (error) {
    console.error("Error stopping HealthKit heart rate observation:", error);
    isObserving = false;
    heartRateCallback = null;
  }
}

/**
 * Check if HealthKit permissions are granted
 */
export async function isHealthKitAuthorized(): Promise<boolean> {
  const hk = await getHealthKit();
  if (!hk) {
    return false;
  }

  try {
    const result = await hk.getAuthorizationStatus({
      permissions: {
        read: [
          "HKWorkoutTypeIdentifier",
          "HKQuantityTypeIdentifierDistanceWalkingRunning",
          "HKQuantityTypeIdentifierHeartRate",
          "HKQuantityTypeIdentifierActiveEnergyBurned",
        ],
      },
    });

    return result && result.authorized === true;
  } catch (error) {
    console.error("Error checking HealthKit authorization:", error);
    return false;
  }
}
