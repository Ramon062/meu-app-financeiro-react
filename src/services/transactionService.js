import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

function getUserTransactionsCollection(userId) {
  return collection(db, 'users', userId, 'transactions');
}

export async function addTransaction(userId, transaction) {
  const payload = {
    ...transaction,
    amount: Number(transaction.amount),
    createdAt: serverTimestamp(),
  };

  await addDoc(getUserTransactionsCollection(userId), payload);
}

export async function listTransactions(userId) {
  const transactionsQuery = query(getUserTransactionsCollection(userId), orderBy('date', 'desc'));
  const snapshot = await getDocs(transactionsQuery);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function removeTransaction(userId, transactionId) {
  const ref = doc(db, 'users', userId, 'transactions', transactionId);
  await deleteDoc(ref);
}
