import { Timestamp } from '@angular/fire/firestore';

export const formattedTimestamp = (timestamp?: Timestamp): Date =>
  timestamp ? timestamp.toDate() : new Date();
