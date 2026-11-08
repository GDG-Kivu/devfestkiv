import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectFirestoreEmulator, deleteDoc, doc, getDoc, getFirestore, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const projectId = 'demo-devfest';
const app = initializeApp({ projectId }, 'rules-test');
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080, { mockUserToken: { sub: 'order-user', user_id: 'order-user' } });
const order = {
  uid: 'order-user', name: 'Test User', email: 'test@example.com', phone: '123456789',
  location: 'Bukavu', commune: 'Ibanda', place: 'Place Mulamba',
  sizes: { S: 0, M: 1, L: 2, XL: 0, XXL: 0 }, createdAt: serverTimestamp(),
};
const target = doc(db, 'tshirtOrders', 'valid-order');

await setDoc(target, order);
await setDoc(doc(db, 'tshirtOrders', 'event-order'), { ...order, location: "À l'événement", commune: '', place: '' });
await assert.rejects(getDoc(target), /permission/i);
await assert.rejects(updateDoc(target, { name: 'Changed' }), /permission/i);
await assert.rejects(deleteDoc(target), /permission/i);
for (const [id, invalid] of Object.entries({
  wrongOwner: { ...order, uid: 'another-user' },
  extraField: { ...order, role: 'admin' },
  invalidPlace: { ...order, place: 'Unknown' },
  invalidQuantity: { ...order, sizes: { ...order.sizes, M: -1 } },
  emptyOrder: { ...order, sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 } },
})) {
  await assert.rejects(setDoc(doc(db, 'tshirtOrders', id), invalid), /permission/i);
}
await deleteApp(app);
const guestApp = initializeApp({ projectId }, 'guest-test');
const guestDb = getFirestore(guestApp);
connectFirestoreEmulator(guestDb, '127.0.0.1', 8080);
await assert.rejects(setDoc(doc(guestDb, 'tshirtOrders', 'unauthenticated'), order), /permission/i);
await deleteApp(guestApp);
console.log('T-shirt order rules: valid create allowed; reads, changes and invalid creates denied.');