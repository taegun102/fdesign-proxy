'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';

export default function GalleryPage() {
  const [user, setUser] = useState(null);
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [tagQuery, setTagQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async (currentUser) => {
      try {
        const q = query(
          collection(db, 'userImages'),
          where('uid', '==', currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setImages(data);
        setFilteredImages(data);
      } catch (err) {
        console.error('❌ 이미지 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchImages(currentUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
  }, []);

  const handleDelete = async (id) => {
    const ok = confirm('정말로 이 이미지를 삭제하시겠습니까?');
    if (!ok) return;
    try {
      await deleteDoc(doc(db, 'userImages', id));
      setImages((prev) => prev.filter((img) => img.id !== id));
      setFilteredImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err) {
      alert('삭제 실패');
      console.error('❌ 삭제 에러:', err);
    }
  };

  const handleUploadToPlayground = async (img) => {
    try {
      // 닉네임 불러오기
      const profileRef = doc(db, 'userProfiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      const nickname = profileSnap.exists() ? profileSnap.data().displayName : '익명';

      await addDoc(collection(db, 'playground'), {
        uid: user.uid,
        nickname,
        url: img.url,
        prompt: img.prompt,
        tags: img.tags || [],
        createdAt: serverTimestamp(),
        comments: [],
        likes: 0, // 🔥 좋아요 수 초기값
        likedBy: [], // 🔥 좋아요 누른 사람 목록 초기화
      });
      alert('✅ 플레이그라운드에 업로드 완료!');
    } catch (err) {
      console.error('❌ 업로드 실패:', err);
      alert('업로드 실패');
    }
  };

  const handleTagSearch = (e) => {
    const q = e.target.value.toLowerCase();
    setTagQuery(q);
    if (!q) {
      setFilteredImages(images);
    } else {
      const filtered = images.filter((img) =>
        img.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
      setFilteredImages(filtered);
    }
  };

  if (loading) return <p className="text-white text-center mt-20">🔄 로딩 중...</p>;
  if (!user) return <p className="text-white text-center mt-20">⚠️ 로그인이 필요합니다.</p>;

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-purple-400">나의 갤러리</h1>

      <input
        type="text"
        value={tagQuery}
        onChange={handleTagSearch}
        placeholder="태그로 검색하기 (예: 후드티)"
        className="w-full max-w-md mb-6 p-2 bg-gray-800 rounded text-white placeholder-gray-500"
      />

      {filteredImages.length === 0 ? (
        <p className="text-gray-400">저장된 이미지가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredImages.map((img, i) => (
            <div key={i} className="bg-gray-800 p-3 rounded shadow-lg relative">
              <img
                src={img.url}
                alt={`img-${i}`}
                className="rounded mb-2 border border-gray-700 w-full"
              />
            
              {img.tags && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {img.tags.map((tag, idx) => (
                    <span key={idx} className="bg-purple-700 text-xs px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-3">
                <button
                  onClick={() => handleUploadToPlayground(img)}
                  className="bg-green-700 hover:bg-green-600 px-3 py-1 text-xs rounded text-white"
                >
                  플레이그라운드에 업로드
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 text-xs rounded text-white"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
