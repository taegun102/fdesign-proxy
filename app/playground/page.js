'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { FaHeart, FaCommentDots } from 'react-icons/fa';

export default function PlaygroundPage() {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [commentInput, setCommentInput] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [sortBy, setSortBy] = useState('createdAt');
  const [tagQuery, setTagQuery] = useState('');

  useEffect(() => {
    onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    fetchPlayground();
  }, [sortBy]);

  const fetchPlayground = async () => {
    const q = query(collection(db, 'playground'), orderBy(sortBy, 'desc'));
    const snapshot = await getDocs(q);

    const postsWithNames = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const userDoc = await getDoc(doc(db, 'userProfiles', data.uid));
        const displayName = userDoc.exists() ? userDoc.data().displayName : '익명';
        return {
          id: docSnap.id,
          ...data,
          uid: data.uid,
          displayName,
          likes: data.likes || [],
          comments: data.comments || [],
        };
      })
    );

    setPosts(postsWithNames);
  };

  const handleAddComment = async (postId, postUid) => {
    if (!user || !commentInput[postId]) return;

    const comment = {
      uid: user.uid,
      nickname: user.displayName || '익명',
      text: commentInput[postId],
      createdAt: new Date(),
    };

    try {
      const postRef = doc(db, 'playground', postId);
      await updateDoc(postRef, {
        comments: arrayUnion(comment),
      });

      if (user.uid !== postUid) {
        await addDoc(collection(db, 'notifications'), {
          type: 'comment',
          fromUid: user.uid,
          toUid: postUid,
          nickname: user.displayName || '익명',
          postId,
          text: comment.text,
          createdAt: new Date(),
        });
      }

      setCommentInput((prev) => ({ ...prev, [postId]: '' }));
      fetchPlayground();
    } catch (err) {
      console.error('❌ 댓글 추가 실패:', err);
    }
  };

  const handleLike = async (postId, postUid) => {
    if (!user) return;

    const postRef = doc(db, 'playground', postId);
    const post = posts.find((p) => p.id === postId);
    const alreadyLiked = post.likes?.includes(user.uid);

    try {
      if (alreadyLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid),
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid),
        });

        if (user.uid !== postUid) {
          await addDoc(collection(db, 'notifications'), {
            type: 'like',
            fromUid: user.uid,
            toUid: postUid,
            nickname: user.displayName || '익명',
            postId,
            createdAt: new Date(),
          });
        }
      }

      fetchPlayground();
    } catch (err) {
      console.error('❌ 좋아요 처리 실패:', err);
    }
  };

  const filteredPosts = posts.filter((post) =>
    tagQuery
      ? post.tags?.some((tag) => tag.toLowerCase().includes(tagQuery.toLowerCase()))
      : true
  );

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-3xl font-bold mb-4 text-purple-400">🎨 플레이그라운드</h1>

      {/* 태그 검색창 */}
      <div className="mb-4">
        <input
          type="text"
          value={tagQuery}
          onChange={(e) => setTagQuery(e.target.value)}
          placeholder="태그 검색 (예: 후드티)"
          className="bg-gray-800 px-3 py-2 rounded w-full max-w-sm"
        />
      </div>

      {/* 정렬 버튼 */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSortBy('createdAt')}
          className={`px-3 py-1 rounded ${sortBy === 'createdAt' ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
          최신순
        </button>
        <button
          onClick={() => setSortBy('likes')}
          className={`px-3 py-1 rounded ${sortBy === 'likes' ? 'bg-purple-600' : 'bg-gray-700'}`}
        >
          인기순
        </button>
      </div>

      {/* 게시물 리스트 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredPosts.map((post) => (
          <div key={post.id} className="bg-gray-900 rounded shadow p-3">
            <img src={post.url} alt="uploaded" className="rounded mb-2" />
            <p className="text-sm text-purple-400 mb-1">👤 {post.displayName}</p>
           

            {post.tags && (
              <div className="flex flex-wrap gap-1 mb-2">
                {post.tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-purple-700 px-2 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
              <button
                className={`flex items-center gap-1 ${
                  post.likes.includes(user?.uid) ? 'text-red-400' : 'hover:text-red-400'
                }`}
                onClick={() => handleLike(post.id, post.uid)}
              >
                <FaHeart />
                좋아요 {post.likes.length}
              </button>

              <button
                className="flex items-center gap-1 hover:text-blue-400"
                onClick={() =>
                  setOpenComments((prev) => ({
                    ...prev,
                    [post.id]: !prev[post.id],
                  }))
                }
              >
                <FaCommentDots />
                댓글 {post.comments.length}
              </button>
            </div>

            {openComments[post.id] && (
              <div className="mt-2 space-y-2">
                {post.comments
                  .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
                  .map((c, i) => (
                    <div key={i} className="text-sm text-gray-300 border-t pt-2">
                      <strong className="text-purple-400">{c.nickname}</strong>: {c.text}
                    </div>
                  ))}

                <input
                  type="text"
                  value={commentInput[post.id] || ''}
                  onChange={(e) =>
                    setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
                  placeholder="댓글 입력"
                  className="w-full p-2 bg-gray-800 rounded text-white mt-2"
                />
                <button
                  onClick={() => handleAddComment(post.id, post.uid)}
                  className="w-full mt-1 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  댓글 등록
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
