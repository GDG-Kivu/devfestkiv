import { Timestamp } from '@angular/fire/firestore';

export const formattedTimestamp = (timestamp?: Timestamp | any): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return isNaN(timestamp.getTime()) ? new Date() : timestamp;
  if (typeof timestamp.toDate === 'function') {
    try {
      const d = timestamp.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch {
      // Fallback below
    }
  }
  if (typeof timestamp.seconds === 'number') {
    const d = new Date(timestamp.seconds * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof timestamp === 'number') {
    const d = new Date(timestamp > 1e11 ? timestamp : timestamp * 1000);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof timestamp === 'string') {
    const trimmed = timestamp.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, day] = trimmed.split('-').map(Number);
      return new Date(y, m - 1, day, 9, 0, 0);
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
};
