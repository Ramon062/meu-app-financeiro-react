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

function getUserAccessCollection(userId) {
  return collection(db, 'users', userId, 'accessControls');
}

export async function addAccessControl(userId, accessData) {
  const payload = {
    ...accessData,
    createdAt: serverTimestamp(),
  };

  await addDoc(getUserAccessCollection(userId), payload);
}

export async function listAccessControls(userId) {
  const accessQuery = query(getUserAccessCollection(userId), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(accessQuery);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function removeAccessControl(userId, accessId) {
  const ref = doc(db, 'users', userId, 'accessControls', accessId);
  await deleteDoc(ref);
}
