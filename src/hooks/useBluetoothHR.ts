import { useState, useRef, useCallback, useEffect, type MutableRefObject } from "react";
import { Capacitor } from "@capacitor/core";
import {
  connectHeartRateMonitor,
  disconnectHeartRateMonitor,
  isBluetoothAvailable,
  type BluetoothConnection,
} from "@/lib/bluetooth";
import { logger } from "@/lib/logger";

export type RunBluetoothStatus = "idle" | "running" | "paused";

type UseBluetoothHROptions = {
  statusRef: MutableRefObject<RunBluetoothStatus>;
};

export function useBluetoothHR({ statusRef }: UseBluetoothHROptions) {
  const [bluetoothDevice, setBluetoothDevice] = useState<string | null>(null);
  const [isConnectingBluetooth, setIsConnectingBluetooth] = useState(false);
  const [bluetoothError, setBluetoothError] = useState("");
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [bluetoothAvailable] = useState(
    () => !Capacitor.isNativePlatform() && isBluetoothAvailable(),
  );

  const bluetoothConnectionRef = useRef<BluetoothConnection | null>(null);
  const heartRateSamplesRef = useRef<number[]>([]);

  const resetBluetoothState = useCallback((message = "") => {
    setBluetoothDevice(null);
    setHeartRate(null);
    setIsConnectingBluetooth(false);
    setBluetoothError(message);
    bluetoothConnectionRef.current = null;
  }, []);

  const handleBluetoothDisconnect = useCallback(() => {
    const disconnectMessage =
      statusRef.current === "running" || statusRef.current === "paused"
        ? "Capteur déconnecté. Vérifiez qu'il est toujours allumé et à portée."
        : "";
    resetBluetoothState(disconnectMessage);
  }, [resetBluetoothState, statusRef]);

  const connectBluetooth = useCallback(async () => {
    if (!bluetoothAvailable) {
      setBluetoothError("Bluetooth non disponible sur cet appareil");
      return;
    }

    setBluetoothError("");
    setIsConnectingBluetooth(true);

    try {
      const connection = await connectHeartRateMonitor();
      bluetoothConnectionRef.current = connection;
      setBluetoothDevice(connection.deviceName);
      setHeartRate(null);

      connection.onHeartRate((bpm) => {
        setHeartRate(bpm);
        if (statusRef.current === "running") {
          heartRateSamplesRef.current = [...heartRateSamplesRef.current, bpm];
        }
      });

      connection.onDisconnect(() => {
        handleBluetoothDisconnect();
      });
    } catch (error) {
      console.error("[Run] operation failed:", error);
      import("@sentry/react")
        .then(({ captureException }) => {
          captureException(error);
        })
        .catch(() => {});
      setBluetoothError("Appareil non trouvé. Vérifiez que votre capteur est allumé.");
      setBluetoothDevice(null);
      setHeartRate(null);
      bluetoothConnectionRef.current = null;
    } finally {
      setIsConnectingBluetooth(false);
    }
  }, [bluetoothAvailable, handleBluetoothDisconnect, statusRef]);

  const disconnectBluetooth = useCallback(() => {
    disconnectHeartRateMonitor();
    resetBluetoothState("");
  }, [resetBluetoothState]);

  const disconnectHardware = useCallback(() => {
    disconnectHeartRateMonitor();
  }, []);

  const clearErrorAndSamplesForRunStart = useCallback(() => {
    setBluetoothError("");
    heartRateSamplesRef.current = [];
  }, []);

  const resetUiAfterFullStop = useCallback(() => {
    setBluetoothDevice(null);
    setHeartRate(null);
    setBluetoothError("");
    bluetoothConnectionRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      try {
        disconnectHeartRateMonitor();
      } catch (e) {
        logger.error("Bluetooth cleanup on unmount failed", e);
      }
    };
  }, []);

  const truncatedDeviceName =
    bluetoothDevice && bluetoothDevice.length > 15
      ? `${bluetoothDevice.slice(0, 15)}…`
      : bluetoothDevice;

  const isConnected = bluetoothDevice !== null;
  const isBluetoothConnected = isConnected;

  return {
    bluetoothDevice,
    bluetoothError,
    isConnectingBluetooth,
    bluetoothAvailable,
    heartRate,
    heartRateSamplesRef,
    truncatedDeviceName,
    isConnected,
    isBluetoothConnected,
    connectBluetooth,
    disconnectBluetooth,
    disconnectHardware,
    clearErrorAndSamplesForRunStart,
    resetUiAfterFullStop,
  };
}
