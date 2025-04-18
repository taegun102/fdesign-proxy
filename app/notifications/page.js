'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';
import {
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';

export default function NotificationsPage() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const q = query(
          collection(db, 'notifications'),
          where('toUid', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => doc.data());
        setNotifications(data);
      }
    });
  }, []);

  if (!user) {
    return <p className="text-white text-center mt-20">⚠️ 로그인이 필요합니다.</p>;
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-purple-400">🔔 알림</h1>
      {notifications.length === 0 ? (
        <p className="text-gray-400">알림이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((n, i) => (
            <li key={i} className="bg-gray-800 p-4 rounded shadow">
              {n.type === 'like' ? (
                <p>
                  ❤️ <span className="text-purple-300">{n.nickname}</span>님이 당신의 게시물을 좋아요 했습니다.
                </p>
              ) : (
                <p>
                  💬 <span className="text-purple-300">{n.nickname}</span>님이 댓글을 남겼습니다: &quot;
                  <span className="text-gray-300">{n.text}</span> &quot;
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {n.createdAt?.toDate().toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
