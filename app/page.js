'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0a001f] to-black text-white overflow-hidden">
      {/* 배경 애니메이션 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-black via-black to-purple-900" />

      {/* 메인 콘텐츠 */}
      <main className="relative z-10 flex flex-col items-center justify-start pt-30 h-screen px-6 text-center">

        {/* 로고 */}
        <img
         src="/logofull.png"
         alt="F_DESIGN 로고"
         className="h-100 w-auto mb-4"
        />


        <h1 className="text-5xl font-bold text-purple-300 drop-shadow-md mb-4">
          간편한 패션 디자인
        </h1>
        <p className="text-lg text-gray-300 mb-4 max-w-xl">
          AI와 함께 만드는 미래의 패션을 지금 시작해보세요.
        </p>

        {user ? (
          <p className="text-purple-400 mb-4">👤 {user.email} 님, 환영합니다!</p>
        ) : (
          <div className="mb-6 space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 transition rounded shadow-lg"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 transition rounded shadow-lg"
            >
              회원가입
            </Link>
          </div>
        )}

        <Link
          href="/generate"
          className="bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 px-6 rounded-2xl text-lg transition-all shadow-[0_0_15px_#a855f7] hover:shadow-[0_0_25px_#c084fc]"
        >
          나만의 의류 제작하기 →
        </Link>
      </main>
    </div>
  );
}
