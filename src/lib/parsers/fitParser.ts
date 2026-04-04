import { calculateDistanceFromTrace, type ImportedRun } from "./gpxParser";

const FIT_EPOCH_MS = Date.UTC(1989, 11, 31, 0, 0, 0);

type FieldDefinition = {
  fieldDefinitionNumber: number;
  size: number;
  baseType: number;
};

type MessageDefinition = {
  globalMessageNumber: number;
  architecture: number;
  fields: FieldDefinition[];
  developerFields: FieldDefinition[];
};

type ParsedFitRecord = {
  lat?: number;
  lng?: number;
  altitude?: number;
  heartRate?: number;
  timestamp?: number;
};

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function readUnsigned(dataView: DataView, offset: number, size: number, littleEndian: boolean) {
  if (size === 1) return dataView.getUint8(offset);
  if (size === 2) return dataView.getUint16(offset, littleEndian);
  if (size === 4) return dataView.getUint32(offset, littleEndian);
  return null;
}

function readSigned(dataView: DataView, offset: number, size: number, littleEndian: boolean) {
  if (size === 1) return dataView.getInt8(offset);
  if (size === 2) return dataView.getInt16(offset, littleEndian);
  if (size === 4) return dataView.getInt32(offset, littleEndian);
  return null;
}

function decodeFieldValue(
  dataView: DataView,
  offset: number,
  field: FieldDefinition,
  littleEndian: boolean,
) {
  const { size, baseType } = field;
  const isSigned = [0x83, 0x84, 0x85, 0x86, 0x8b, 0x8e].includes(baseType);
  return isSigned
    ? readSigned(dataView, offset, size, littleEndian)
    : readUnsigned(dataView, offset, size, littleEndian);
}

function semicirclesToDegrees(value: number) {
  return (value * 180) / 2 ** 31;
}

function fitTimestampToIso(seconds: number) {
  return new Date(FIT_EPOCH_MS + seconds * 1000).toISOString();
}

function fitTimestampToMs(seconds: number) {
  return FIT_EPOCH_MS + seconds * 1000;
}

function detectFitSource(fileName?: string): ImportedRun["source"] {
  const normalized = `${fileName ?? ""}`.toLowerCase();
  if (normalized.includes("garmin")) return "garmin";
  if (normalized.includes("strava")) return "strava";
  return "garmin";
}

export async function parseFitFile(file: Blob & { name?: string }): Promise<ImportedRun | null> {
  try {
    const buffer = await file.arrayBuffer();
    return parseFitArrayBuffer(buffer, file.name);
  } catch {
    return null;
  }
}

export function parseFitArrayBuffer(buffer: ArrayBuffer, fileName?: string): ImportedRun | null {
  try {
    const dataView = new DataView(buffer);
    if (dataView.byteLength < 14) {
      return null;
    }

    const headerSize = dataView.getUint8(0);
    const dataSize = dataView.getUint32(4, true);
    const dataType = String.fromCharCode(
      dataView.getUint8(8),
      dataView.getUint8(9),
      dataView.getUint8(10),
      dataView.getUint8(11),
    );

    if (dataType !== ".FIT") {
      return null;
    }

    let offset = headerSize;
    const endOffset = Math.min(dataView.byteLength, headerSize + dataSize);
    const definitions = new Map<number, MessageDefinition>();
    const records: ParsedFitRecord[] = [];
    const heartRates: number[] = [];

    let sessionStartTimestamp: number | undefined;
    let sessionDistanceMeters: number | undefined;
    let sessionDurationSeconds: number | undefined;
    let sessionAscent: number | undefined;
    let sessionAvgHeartRate: number | undefined;
    let lastTimestamp: number | undefined;

    while (offset < endOffset) {
      const header = dataView.getUint8(offset);
      offset += 1;

      const isCompressedTimestampHeader = (header & 0x80) === 0x80;
      const localMessageType = isCompressedTimestampHeader ? (header >> 5) & 0x03 : header & 0x0f;

      if (!isCompressedTimestampHeader && (header & 0x40) === 0x40) {
        const reserved = dataView.getUint8(offset);
        const architecture = dataView.getUint8(offset + 1);
        const littleEndian = architecture === 0;
        const globalMessageNumber = dataView.getUint16(offset + 2, littleEndian);
        const fieldCount = dataView.getUint8(offset + 4);
        offset += 5;

        const fields: FieldDefinition[] = [];
        for (let index = 0; index < fieldCount; index += 1) {
          fields.push({
            fieldDefinitionNumber: dataView.getUint8(offset),
            size: dataView.getUint8(offset + 1),
            baseType: dataView.getUint8(offset + 2),
          });
          offset += 3;
        }

        const hasDeveloperFields = (header & 0x20) === 0x20;
        const developerFields: FieldDefinition[] = [];
        if (hasDeveloperFields) {
          const developerFieldCount = dataView.getUint8(offset);
          offset += 1;
          for (let index = 0; index < developerFieldCount; index += 1) {
            developerFields.push({
              fieldDefinitionNumber: dataView.getUint8(offset),
              size: dataView.getUint8(offset + 1),
              baseType: dataView.getUint8(offset + 2),
            });
            offset += 3;
          }
        }

        void reserved;
        definitions.set(localMessageType, {
          globalMessageNumber,
          architecture,
          fields,
          developerFields,
        });
        continue;
      }

      const definition = definitions.get(localMessageType);
      if (!definition) {
        return null;
      }

      const littleEndian = definition.architecture === 0;
      const values = new Map<number, number | null>();
      const fieldsToRead = [...definition.fields, ...definition.developerFields];

      for (const field of fieldsToRead) {
        values.set(
          field.fieldDefinitionNumber,
          decodeFieldValue(dataView, offset, field, littleEndian),
        );
        offset += field.size;
      }

      if (isCompressedTimestampHeader) {
        const timeOffset = header & 0x1f;
        const base = typeof lastTimestamp === "number" ? lastTimestamp : 0;
        const masked = base & ~0x1f;
        let resolved = masked + timeOffset;
        if (typeof lastTimestamp === "number" && resolved < lastTimestamp) {
          resolved += 0x20;
        }
        values.set(253, resolved);
      }

      if (definition.globalMessageNumber === 20) {
        const positionLat = values.get(0);
        const positionLong = values.get(1);
        const altitudeRaw = values.get(2);
        const heartRate = values.get(3);
        const timestamp = values.get(253);

        if (typeof heartRate === "number" && heartRate > 0) {
          heartRates.push(heartRate);
        }

        if (typeof timestamp === "number") {
          lastTimestamp = timestamp;
        }

        if (typeof positionLat === "number" && typeof positionLong === "number") {
          records.push({
            lat: semicirclesToDegrees(positionLat),
            lng: semicirclesToDegrees(positionLong),
            altitude: typeof altitudeRaw === "number" ? altitudeRaw / 5 - 500 : undefined,
            heartRate: typeof heartRate === "number" ? heartRate : undefined,
            timestamp: typeof timestamp === "number" ? fitTimestampToMs(timestamp) : undefined,
          });
        }
      }

      if (definition.globalMessageNumber === 18) {
        const startTimestamp = values.get(2);
        const totalElapsedTime = values.get(7);
        const totalTimerTime = values.get(8);
        const totalDistance = values.get(9);
        const avgHeartRate = values.get(16);
        const totalAscent = values.get(22);

        if (typeof startTimestamp === "number") {
          sessionStartTimestamp = startTimestamp;
        }
        if (typeof totalDistance === "number") {
          sessionDistanceMeters = totalDistance / 100;
        }
        if (typeof totalTimerTime === "number") {
          sessionDurationSeconds = totalTimerTime / 1000;
        } else if (typeof totalElapsedTime === "number") {
          sessionDurationSeconds = totalElapsedTime / 1000;
        }
        if (typeof totalAscent === "number") {
          sessionAscent = totalAscent;
        }
        if (typeof avgHeartRate === "number") {
          sessionAvgHeartRate = avgHeartRate;
        }
      }
    }

    if (!records.length && typeof sessionDistanceMeters !== "number" && typeof sessionStartTimestamp !== "number") {
      return null;
    }

    const gpsTrace = records
      .filter((record): record is Required<Pick<ParsedFitRecord, "lat" | "lng">> & ParsedFitRecord => {
        return typeof record.lat === "number" && typeof record.lng === "number";
      })
      .map((record, index) => ({
        lat: record.lat,
        lng: record.lng,
        time:
          record.timestamp ??
          (typeof sessionStartTimestamp === "number"
            ? fitTimestampToMs(sessionStartTimestamp) + index * 1000
            : Date.now() + index * 1000),
      }));

    const distanceKm =
      typeof sessionDistanceMeters === "number"
        ? round(sessionDistanceMeters / 1000)
        : round(calculateDistanceFromTrace(gpsTrace));

    const startedAt =
      typeof sessionStartTimestamp === "number"
        ? fitTimestampToIso(sessionStartTimestamp)
        : gpsTrace[0]
          ? new Date(gpsTrace[0].time).toISOString()
          : new Date().toISOString();

    const durationSeconds =
      typeof sessionDurationSeconds === "number"
        ? Math.round(sessionDurationSeconds)
        : gpsTrace.length > 1
          ? Math.max(0, Math.round((gpsTrace[gpsTrace.length - 1].time - gpsTrace[0].time) / 1000))
          : 0;

    const elevationGain =
      typeof sessionAscent === "number"
        ? Math.round(sessionAscent)
        : calculateElevationGainFromRecords(records);

    const titleDate = new Date(startedAt).toLocaleDateString("fr-FR");

    return {
      title: `Course importee ${titleDate}`,
      distance_km: distanceKm,
      duration_seconds: durationSeconds,
      elevation_gain: elevationGain,
      average_heartrate:
        typeof sessionAvgHeartRate === "number"
          ? sessionAvgHeartRate
          : heartRates.length
            ? Math.round(heartRates.reduce((sum, value) => sum + value, 0) / heartRates.length)
            : undefined,
      gps_trace: gpsTrace,
      started_at: startedAt,
      source: detectFitSource(fileName),
    };
  } catch {
    return null;
  }
}

function calculateElevationGainFromRecords(records: ParsedFitRecord[]) {
  let gain = 0;
  for (let index = 1; index < records.length; index += 1) {
    const current = records[index].altitude;
    const previous = records[index - 1].altitude;
    if (typeof current !== "number" || typeof previous !== "number") {
      continue;
    }
    const delta = current - previous;
    if (delta > 0) {
      gain += delta;
    }
  }
  return Math.round(gain);
}
