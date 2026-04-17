const HEART_RATE_SERVICE = 0x180d;
const HEART_RATE_MEASUREMENT = 0x2a37;
const KNOWN_HR_DEVICES = [
  "HRM",
  "Polar",
  "Garmin",
  "Wahoo",
  "TICKR",
  "Suunto",
  "Decathlon",
  "Kalenji",
  "ANT",
];

export type BluetoothConnection = {
  deviceName: string;
  disconnect: () => void;
  onHeartRate: (callback: (bpm: number) => void) => void;
  onDisconnect: (callback: () => void) => void;
};

type InternalConnection = {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic;
  heartRateCallbacks: Set<(bpm: number) => void>;
  disconnectCallbacks: Set<() => void>;
  characteristicHandler: (event: Event) => void;
  deviceDisconnectHandler: () => void;
};

let activeConnection: InternalConnection | null = null;

function parseHeartRateMeasurement(dataView: DataView) {
  const flags = dataView.getUint8(0);
  const isUint16 = (flags & 0x01) === 0x01;
  return isUint16 ? dataView.getUint16(1, true) : dataView.getUint8(1);
}

function cleanupConnection() {
  if (!activeConnection) return;

  activeConnection.characteristic.removeEventListener(
    "characteristicvaluechanged",
    activeConnection.characteristicHandler,
  );
  activeConnection.device.removeEventListener(
    "gattserverdisconnected",
    activeConnection.deviceDisconnectHandler,
  );

  activeConnection = null;
}

export function isBluetoothAvailable() {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}

export async function connectHeartRateMonitor(): Promise<BluetoothConnection> {
  if (!isBluetoothAvailable()) {
    throw new Error("Bluetooth non disponible sur cet appareil.");
  }

  disconnectHeartRateMonitor();

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [HEART_RATE_SERVICE] }],
    optionalServices: [HEART_RATE_SERVICE],
  });

  const server = await device.gatt?.connect();
  if (!server) {
    throw new Error("Connexion Bluetooth impossible.");
  }

  const service = await server.getPrimaryService(HEART_RATE_SERVICE);
  const characteristic = await service.getCharacteristic(HEART_RATE_MEASUREMENT);
  const heartRateCallbacks = new Set<(bpm: number) => void>();
  const disconnectCallbacks = new Set<() => void>();

  const characteristicHandler = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic | null;
    const value = target?.value;
    if (!value) return;

    const bpm = parseHeartRateMeasurement(value);
    heartRateCallbacks.forEach((callback) => callback(bpm));
  };

  const deviceDisconnectHandler = () => {
    disconnectCallbacks.forEach((callback) => callback());
    cleanupConnection();
  };

  characteristic.addEventListener("characteristicvaluechanged", characteristicHandler);
  device.addEventListener("gattserverdisconnected", deviceDisconnectHandler);
  await characteristic.startNotifications();

  activeConnection = {
    device,
    characteristic,
    heartRateCallbacks,
    disconnectCallbacks,
    characteristicHandler,
    deviceDisconnectHandler,
  };

  const deviceLabel = device.name?.trim() ?? "";
  const matchedKnown = KNOWN_HR_DEVICES.find((known) =>
    deviceLabel.toLowerCase().includes(known.toLowerCase())
  );

  return {
    deviceName: deviceLabel || (matchedKnown ? `${matchedKnown} HR` : "Capteur cardiaque"),
    disconnect: () => disconnectHeartRateMonitor(),
    onHeartRate: (callback: (bpm: number) => void) => {
      heartRateCallbacks.add(callback);
    },
    onDisconnect: (callback: () => void) => {
      disconnectCallbacks.add(callback);
    },
  };
}

export function disconnectHeartRateMonitor() {
  try {
    if (!activeConnection) return;

    const device = activeConnection.device;
    cleanupConnection();

    try {
      if (device.gatt?.connected) {
        device.gatt.disconnect();
      }
    } catch {
      // Ignore disconnect failures and still clear local listeners/state.
    }
  } catch {
    activeConnection = null;
  }
}
