import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// 한국 시간 기준 자정 타임스탬프 구하기
function getKoreaMidnight() {
  const now = new Date();
  now.setUTCHours(15, 0, 0, 0); // 한국 자정 = UTC 15:00
  return now;
}

export async function canGenerateImage(userId) {
  const userRef = doc(db, 'usageLogs', userId);
  const snapshot = await getDoc(userRef);

  const today = getKoreaMidnight();

  if (!snapshot.exists()) {
    await setDoc(userRef, { count: 1, resetDate: today });
    return true;
  }

  const data = snapshot.data();
  const { count, resetDate } = data;

  if (!resetDate || resetDate.toDate() < today) {
    await updateDoc(userRef, { count: 1, resetDate: today });
    return true;
  }

  if (count < 5) {
    await updateDoc(userRef, { count: count + 1 });
    return true;
  }

  return false;
}
