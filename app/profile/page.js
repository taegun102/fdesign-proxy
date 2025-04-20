'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';
import {
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  getDoc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [message, setMessage] = useState('');
  const [myUploads, setMyUploads] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
        setNewNickname(currentUser.displayName || '');
        await fetchMyUploads(currentUser.uid);
        await fetchLikedPosts(currentUser.uid);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleNicknameUpdate = async () => {
    if (!user) return;

    try {
      await updateProfile(user, { displayName: newNickname });

      const profileRef = doc(db, 'userProfiles', user.uid);
      
      setDisplayName(newNickname);
      setMessage('✅ 닉네임이 성공적으로 변경되었습니다.');

      setDisplayName(newNickname);
      setMessage('✅ 닉네임이 성공적으로 변경되었습니다.');
    } catch (err) {
      console.error('❌ 닉네임 변경 실패:', err);
      setMessage('닉네임 변경 중 오류가 발생했습니다.');
    }
  };

  const fetchMyUploads = async (uid) => {
    const q = query(collection(db, 'playground'), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setMyUploads(data);
  };

  const fetchLikedPosts = async (uid) => {
    const q = query(collection(db, 'playground'));
    const snapshot = await getDocs(q);
    const liked = snapshot.docs
      .filter((doc) => (doc.data().likes || []).includes(uid))
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
    setLikedPosts(liked);
  };

  const handleDeletePost = async (id) => {
    const ok = confirm('정말 삭제하시겠습니까?');
    if (!ok) return;

    try {
      await deleteDoc(doc(db, 'playground', id));
      setMyUploads((prev) => prev.filter((post) => post.id !== id));
    } catch (err) {
      console.error('❌ 삭제 실패:', err);
    }
  };

  const handleUnlike = async (postId) => {
    try {
      const postRef = doc(db, 'playground', postId);
      const postSnap = await getDoc(postRef);
      const data = postSnap.data();
      const newLikes = (data.likes || []).filter((uid) => uid !== user.uid);
      await updateDoc(postRef, { likes: newLikes });

      setLikedPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (err) {
      console.error('❌ 좋아요 취소 실패:', err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-purple-400">👤 프로필</h1>

      <div className="max-w-md mb-10 space-y-4">
        <div>
          <label className="text-sm text-gray-300 block mb-1">현재 닉네임</label>
          <p className="text-lg font-semibold">{displayName || '없음'}</p>
        </div>

        <div>
          <label className="text-sm text-gray-300 block mb-1">새 닉네임 설정</label>
          <input
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded"
            placeholder="닉네임 입력"
          />
        </div>

        <button
          onClick={handleNicknameUpdate}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
        >
          닉네임 저장
        </button>

        {message && <p className="text-green-400 text-sm">{message}</p>}
      </div>

      <hr className="border-gray-700 my-6" />

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-purple-300">📤 내가 업로드한 이미지</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {myUploads.map((img) => (
            <div key={img.id} className="bg-gray-800 p-3 rounded shadow-lg">
              <img src={img.url} alt="업로드 이미지" className="rounded mb-2" />
              <button
                onClick={() => handleDeletePost(img.id)}
                className="mt-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
              >
              </button>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-gray-700 my-6" />

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-purple-300">❤️ 내가 좋아요 누른 이미지</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {likedPosts.map((img) => (
            <div key={img.id} className="bg-gray-800 p-3 rounded shadow-lg">
              <img src={img.url} alt="좋아요 이미지" className="rounded mb-2" />
              <button
                onClick={() => handleUnlike(img.id)}
                className="mt-2 bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-xs"
              >
                ❤️ 좋아요 취소
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
