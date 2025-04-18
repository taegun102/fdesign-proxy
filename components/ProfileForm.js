'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function ProfileForm() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, 'userProfiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDisplayName(data.displayName || '');
        }
      }
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;

    await setDoc(doc(db, 'userProfiles', user.uid), {
      displayName,
    });

    alert('✅ 닉네임이 저장되었습니다!');
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md mx-auto text-white">
      <h2 className="text-xl font-bold mb-4 text-purple-400">프로필 설정</h2>

      <label className="block mb-2 text-sm">닉네임</label>
      <input
        className="w-full mb-4 p-2 rounded bg-gray-800 text-white"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="닉네임을 입력하세요"
      />

      <button
        onClick={handleSave}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded"
      >
        저장하기
      </button>
    </div>
  );
}
