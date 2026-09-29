# Firestore data contract

This project uses Firestore Native, Standard edition. Event-scoped content belongs under `events/{editionId}`. Do not add new root collections for edition-specific data.

## Collection layout

| Path                                                             | Purpose                                                                                        | Access                                                                                           |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `events/{editionId}`                                             | General event configuration, including date, venue, registration URL and `maxQuestionsPerUser` | Public read; admin create/update                                                                 |
| `events/{editionId}/sessions/{sessionId}`                        | Live sessions                                                                                  | Authenticated read when active; admin writes                                                     |
| `events/{editionId}/sessions/{sessionId}/questions/{questionId}` | Questions posted for a live session                                                            | Authenticated read for active sessions; authenticated create with matching UID; admin moderation |
| `events/{editionId}/questionQuotas/{uid}`                        | Per-edition question count and last atomic question write                                      | User reads own count; admin can inspect; constrained user transaction writes                     |
| `events/{editionId}/speakers/{speakerId}`                        | Edition speakers                                                                               | Published read; admin writes                                                                     |
| `events/{editionId}/agenda/{agendaItemId}`                       | Agenda entries                                                                                 | Published read; admin writes                                                                     |
| `events/{editionId}/faq/{faqId}`                                 | FAQ entries                                                                                    | Published read; admin writes                                                                     |
| `events/{editionId}/partners/{partnerId}`                        | Partners and sponsors, represented by `EventPartner`                                           | Published read; admin writes                                                                     |
| `events/{editionId}/news/{articleId}`                            | News articles                                                                                  | Published read; admin writes                                                                     |
| `events/{editionId}/remote/{controllerId}`                       | Live presentation remote state                                                                 | Authenticated read; admin writes                                                                 |
| `events/{editionId}/emojis/{reactionId}`                         | Live reaction events                                                                           | Authenticated read/create; admin update/delete                                                   |
| `users/{uid}`                                                    | Global profile and role (`invite` or `admin`)                                                  | Self/admin read; client writes denied                                                            |
| `siteSettings/global`                                            | Global settings, especially `currentEditionId`                                                 | Public read; admin writes                                                                        |

Do not create a separate `sponsors` subcollection: sponsors use `partners` with an appropriate `role`. Existing root `sponsors` documents were considered migration sources only.

## Models

- `EventDocument` is the event-root contract. Its critical fields are `editionId`, `date.start`, `date.end`, venue/contact fields and `maxQuestionsPerUser`. Partner, agenda and speaker lists are subcollections, not root arrays.
- `SiteSettings` contains the global `currentEditionId`.
- `LiveSession<Timestamp>` is stored in the edition's `sessions` collection. New questions must not be appended to the legacy embedded `questions` array.
- `LiveQuestion` is stored as a question subdocument. `uid`, `contenu`, `createdAt` and `status` are required; profile fields and reactions are optional.
- `QuestionQuota` is scoped to one edition and UID. Its `count` is increased atomically with exactly one question write.
- `Speaker`, `AgendaItem`, `FaqItem`, `NewsArticle` and `EventPartner` are the shared CMS contracts in `features/cms/models`.

Required versus optional fields are expressed directly in the interfaces: `?` denotes optional; fields without `?` are required. `status`/`isPublished` control public visibility. Keep new document fields in these interfaces before writing them from a component.

## FirestoreService API

Inject `FirestoreService`; components should not construct collection/document paths or call Firebase SDK functions themselves.

- `getCurrentEditionId()` resolves `siteSettings/global.currentEditionId`, falling back to `EVENT_CONFIG.edition` if settings are not configured.
- `getEvent(editionId)` reads the event root. `getEventWithFallback(editionId)` uses local `EVENT_CONFIG` only for the bundled edition when the document is missing or unavailable. `getCurrentEventWithFallback()` combines those operations.
- `getEventCollection<T>(editionId, collectionName)` streams one typed subcollection. `getEventDocument<T>(...)` streams one document.
- `getEventCollectionResult<T>(editionId, collectionName, fallback?)` emits `loading`, then `success`; if Firestore fails it emits `error` and includes the optional local fallback.
- If that collection is empty and a fallback is supplied, `getEventCollectionResult` emits `success` with `source: 'fallback'`; use this only for critical content with a deliberately maintained local default.
- `getPublishedEventCollection<T>(...)` and its `...Result` variant query `isPublished == true` or `status == 'published'`. Use these for public pages: Firestore rules are not filters, so querying a collection that can also return drafts is rejected even if the UI hides drafts afterward.
- `createEventDocument(...)` creates a document and supplies a generated ID when one is not passed. `saveEventDocument(...)` upserts/merges. `updateEventDocument(...)` updates an existing document and fails if it does not exist. `deleteEventDocument(...)` deletes one document.
- `saveEvent(...)` and `saveSiteSettings(...)` are admin operations governed by Firestore rules.
- `getSessions(editionId?)` and `getActiveSessions(editionId?)` default to the current edition. Pass an edition explicitly in admin/history views.
- `getQuestions(sessionId, editionId?)` reads a session's question subcollection. `addQuestion(sessionId, question, editionId?)` creates a pending question and increments that user's edition quota in the same transaction.
- `setSession(...)`, `deleteSession(...)`, `setRemote(...)`, and `setEmojis(...)` preserve the live module's specific operations while resolving the event edition centrally.

Firestore does not cascade deletes. Deleting a session document does not automatically delete its `questions` subcollection; use a deliberate admin cleanup/migration operation if cascading removal is required.

## Timestamp conversion and states

Use `formattedTimestamp(timestamp?: Timestamp)` from `shared/utils/formatted-timestamp.ts` when adapting Firestore timestamps to `Date` values. Do not duplicate timestamp conversion in components.

Use `FirestoreResult<T>` from `shared/models/firestore-result.model.ts` for future page/service state: `loading`, `success` with data and source (`firestore` or `fallback`), or `error` with an optional fallback value.

## Security rules

`firestore.rules` is the security boundary; Angular guards are navigation UX only. Admin is determined by `users/{uid}.role == 'admin'` and `disabled != true`. Client writes to `users` are denied. CMS/event/session mutations are admin-only. Public questions require Authentication, the caller's UID, bounded content and a pending status; question plus quota must be one atomic transaction. The quota limit is read from `events/{editionId}.maxQuestionsPerUser` and defaults to 5 when absent. Values above 100 are rejected by rules.

When adding a collection, update `EventSubcollection`, its model and path helper if appropriate, this document, and `firestore.rules` in the same change.

### Rules verification matrix

| Identity                                    | Read published content / active sessions            | Create a question                        | Write event, session, CMS or remote state |
| ------------------------------------------- | --------------------------------------------------- | ---------------------------------------- | ----------------------------------------- |
| Anonymous Auth visitor                      | Allowed                                             | Allowed only under the per-edition quota | Denied                                    |
| Google user without admin profile           | Allowed                                             | Allowed only under the per-edition quota | Denied                                    |
| Enabled admin (`role: admin`, not disabled) | Allowed                                             | Allowed under normal question validation | Allowed                                   |
| Disabled admin                              | Allowed only where public/signed-in read is allowed | Allowed only under the per-edition quota | Denied                                    |

Before publishing rule changes, verify each row with the Firestore Emulator or Rules Playground, including a question batch with and without the matching quota increment. Emulator-based automated rule tests require a compatible Java 21+ runtime in this workspace.
