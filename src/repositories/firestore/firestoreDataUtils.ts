import { Timestamp } from 'firebase/firestore';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const convertFirestoreTimestamps = (data: unknown): unknown => {
  if (data instanceof Timestamp) {
    return data.toDate();
  }

  if (Array.isArray(data)) {
    return data.map(convertFirestoreTimestamps);
  }

  if (isRecord(data)) {
    const converted: Record<string, unknown> = {};
    Object.keys(data).forEach((key) => {
      converted[key] = convertFirestoreTimestamps(data[key]);
    });
    return converted;
  }

  return data;
};

export const isTimestampLike = (value: unknown): value is { toDate: () => Date } =>
  typeof value === 'object' &&
  value !== null &&
  'toDate' in value &&
  typeof (value as { toDate?: unknown }).toDate === 'function';

export const safeClone = <T,>(value: T): T => {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    return value;
  }

  return JSON.parse(serialized) as T;
};

