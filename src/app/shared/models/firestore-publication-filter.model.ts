export type FirestorePublicationFilter =
  | { field: 'isPublished'; value: true }
  | { field: 'status'; value: 'published' };
