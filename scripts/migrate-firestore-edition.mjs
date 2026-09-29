import fs from 'node:fs';
import ts from 'typescript';
import { initializeApp } from 'firebase/app';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    runTransaction,
    serverTimestamp,
} from 'firebase/firestore';

const applyChanges = process.argv.includes('--apply');
const editionArg = process.argv.find((argument) => argument.startsWith('--edition='));
const projectId = JSON.parse(fs.readFileSync('.firebaserc', 'utf8')).projects.default;
const eventSource = fs.readFileSync('src/app/config/event.config.ts', 'utf8');
const compiledEventConfig = ts.transpileModule(eventSource, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const eventModuleUrl = `data:text/javascript;base64,${Buffer.from(compiledEventConfig).toString('base64')}`;
const { EVENT_CONFIG } = await import(eventModuleUrl);
const editionId = editionArg?.split('=')[1] ?? String(EVENT_CONFIG.edition);

const readConfigValue = (name) =>
    eventSource.match(new RegExp(`${name}:\\s*'([^']+)'`))?.[1];
const app = initializeApp({
    apiKey: readConfigValue('apiKey'),
    appId: readConfigValue('appId'),
    projectId,
});
const db = getFirestore(app);
const pendingWrites = [];
const skippedCounts = new Map();
const migratedCounts = new Map();

const increment = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
const sourceCollection = async (name) => getDocs(collection(db, name));

async function planCreate(path, data, sourceName) {
    const targetRef = doc(db, path);
    if ((await getDoc(targetRef)).exists()) {
        increment(skippedCounts, sourceName);
        return;
    }
    pendingWrites.push({ targetRef, data, sourceName });
    increment(migratedCounts, sourceName);
}

function dateFromLegacyValue(value) {
    if (value && typeof value.toDate === 'function') return value.toDate();
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function slug(value) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

const eventRef = doc(db, `events/${editionId}`);
const existingEvent = await getDoc(eventRef);
const eventData = {
    editionId,
    edition: EVENT_CONFIG.edition,
    year: EVENT_CONFIG.year,
    name: EVENT_CONFIG.name,
    fullName: EVENT_CONFIG.fullName,
    date: EVENT_CONFIG.date,
    venue: EVENT_CONFIG.venue,
    theme: EVENT_CONFIG.theme,
    description: EVENT_CONFIG.description,
    registrationUrl: EVENT_CONFIG.registrationUrl,
    contact: EVENT_CONFIG.contact,
    impactStats: EVENT_CONFIG.impactStats,
    engagementYear: EVENT_CONFIG.engagementYear,
    maxQuestionsPerUser: 5,
    isPublished: true,
};

if (existingEvent.exists()) {
    const current = existingEvent.data();
    const missingFields = Object.fromEntries(
        Object.entries(eventData).filter(([key]) => !(key in current)),
    );
    if (Object.keys(missingFields).length) {
        pendingWrites.push({ targetRef: eventRef, data: missingFields, sourceName: 'event-root', merge: true });
        increment(migratedCounts, 'event-root-fields');
    } else {
        increment(skippedCounts, 'event-root');
    }
} else {
    pendingWrites.push({ targetRef: eventRef, data: eventData, sourceName: 'event-root' });
    increment(migratedCounts, 'event-root');
}

const siteSettingsRef = doc(db, 'siteSettings/global');
const siteSettingsSnapshot = await getDoc(siteSettingsRef);
if (!siteSettingsSnapshot.exists()) {
    pendingWrites.push({
        targetRef: siteSettingsRef,
        data: { currentEditionId: editionId, updatedAt: serverTimestamp() },
        sourceName: 'site-settings',
    });
    increment(migratedCounts, 'site-settings');
} else if (!siteSettingsSnapshot.data().currentEditionId) {
    pendingWrites.push({
        targetRef: siteSettingsRef,
        data: { currentEditionId: editionId, updatedAt: serverTimestamp() },
        sourceName: 'site-settings',
        merge: true,
    });
    increment(migratedCounts, 'site-settings-edition');
} else {
    increment(skippedCounts, 'site-settings');
}

const legacySessions = await sourceCollection('sessions');
let migratedQuestionCount = 0;
for (const sessionSnapshot of legacySessions.docs) {
    const session = sessionSnapshot.data();
    const questions = Array.isArray(session.questions) ? session.questions : [];
    const sessionId = sessionSnapshot.id;
    const sessionCopy = { ...session, id: session.id ?? sessionId, questions: [] };
    await planCreate(`events/${editionId}/sessions/${sessionId}`, sessionCopy, 'sessions');

    for (let index = 0; index < questions.length; index++) {
        const legacyQuestion = questions[index] ?? {};
        const questionId = `legacy-${sessionId}-${String(index + 1).padStart(4, '0')}`;
        const question = {
            uid: typeof legacyQuestion.uid === 'string' ? legacyQuestion.uid : `legacy-${sessionId}`,
            contenu: String(legacyQuestion.contenu ?? legacyQuestion.text ?? ''),
            displayName: legacyQuestion.displayName ?? legacyQuestion.name ?? 'Participant',
            ...(legacyQuestion.email ? { email: legacyQuestion.email } : {}),
            time: String(legacyQuestion.time ?? ''),
            createdAt: dateFromLegacyValue(legacyQuestion.createdAt ?? legacyQuestion.time),
            status: 'approved',
            reactions: Array.isArray(legacyQuestion.reactions) ? legacyQuestion.reactions : [],
        };
        await planCreate(
            `events/${editionId}/sessions/${sessionId}/questions/${questionId}`,
            question,
            'session-questions',
        );
        migratedQuestionCount++;
    }
}

for (const collectionName of [
    'speakers',
    'agenda',
    'faq',
    'news',
    'partners',
    'sponsors',
    'questionQuotas',
    'remote',
    'emojis',
]) {
    const snapshots = await sourceCollection(collectionName);
    const targetCollection = collectionName === 'sponsors' ? 'partners' : collectionName;
    for (const snapshot of snapshots.docs) {
        const data = snapshot.data();
        const targetId =
            collectionName === 'sponsors'
                ? `legacy-sponsor-${snapshot.id}`
                : collectionName === 'partners'
                    ? `legacy-partner-${snapshot.id}`
                    : snapshot.id;
        let contentData;
        if (['speakers', 'agenda', 'faq', 'news', 'partners', 'sponsors'].includes(collectionName)) {
            contentData = {
                ...data,
                id: data.id ?? targetId,
                ...(data.isPublished === undefined && data.status === undefined ? { isPublished: true } : {}),
            };
        } else if (collectionName === 'remote') {
            contentData = {
                ...data,
                id: snapshot.id,
                lastCommand: data.command ?? 'idle',
                command: 'idle',
                archived: true,
            };
        } else if (collectionName === 'emojis') {
            contentData = { ...data, id: data.id ?? snapshot.id, archived: true };
        } else {
            contentData = { ...data, uid: data.uid ?? snapshot.id };
        }
        await planCreate(
            `events/${editionId}/${targetCollection}/${targetId}`,
            contentData,
            collectionName,
        );
    }
}

for (const support of EVENT_CONFIG.supports) {
    const partnerId = `event-config-${slug(support.name)}`;
    await planCreate(
        `events/${editionId}/partners/${partnerId}`,
        {
            ...support,
            id: partnerId,
            order: EVENT_CONFIG.supports.indexOf(support),
            isPublished: true,
        },
        'event-config-partners',
    );
}

const summary = {
    mode: applyChanges ? 'apply' : 'preview',
    projectId,
    editionId,
    plannedDocuments: pendingWrites.length,
    migratedQuestions: migratedQuestionCount,
    plannedBySource: Object.fromEntries(migratedCounts),
    alreadyPresentBySource: Object.fromEntries(skippedCounts),
    preservedRootCollections: ['sessions', 'speakers', 'agenda', 'faq', 'partners', 'sponsors', 'questionQuotas'],
    intentionallyNotCopied: ['users'],
};
console.log(JSON.stringify(summary, null, 2));

if (applyChanges) {
    let created = 0;
    let skipped = 0;
    for (const operation of pendingWrites) {
        const wrote = await runTransaction(db, async (transaction) => {
            const target = await transaction.get(operation.targetRef);
            if (target.exists()) return false;
            transaction.set(operation.targetRef, operation.data, operation.merge ? { merge: true } : {});
            return true;
        });
        if (wrote) created++;
        else skipped++;
    }
    console.log(JSON.stringify({ created, skipped, sourceDocumentsDeleted: 0 }, null, 2));
} else {
    console.log('Aucune donnée modifiée. Relancer avec --apply pour effectuer la copie non destructive.');
}
