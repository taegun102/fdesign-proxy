'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '../../firebase/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  FaHome,
  FaPencilAlt,
  FaImage,
  FaPalette,
  FaBell,
  FaUser,
  FaSignInAlt,
  FaBan,
} from 'react-icons/fa';

export default function NavBar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <nav className="bg-black text-white px-6 py-4 flex justify-between items-center border-b border-gray-800">
      {/* 왼쪽: 로고 */}
      <Link href="/">
        <img
          src="/logo.png"
          alt="F_DESIGN Logo"
          className="h-16 w-auto mr-1 object-contain"
        />
      </Link>

      {/* 오른쪽: 메뉴 */}
      <div className="flex items-center gap-5 text-xl">

        {!user ? (
          <Link href="/login" className="hover:text-purple-400" title="로그인">
            <FaSignInAlt />
          </Link>
        ) : (
          <>
            <Link href="/generate" className="hover:text-purple-400" title="이미지 생성">
              <FaPencilAlt />
            </Link>
            <Link href="/gallery" className="hover:text-purple-400" title="갤러리">
              <FaImage />
            </Link>
            <Link href="/playground" className="hover:text-purple-400" title="플레이그라운드">
              <FaPalette />
            </Link>
            <Link
              href="/notifications"
              className="hover:text-purple-400"
              title="알림"
            >
              <FaBell />
            </Link>
            <Link
              href="/profile"
              className="hover:text-purple-400 text-sm flex items-center gap-1"
              title="프로필"
            >
              <FaUser />
              {user.displayName || '프로필'}
            </Link>
            <button
              onClick={handleLogout}
              className="hover:text-red-400"
              title="로그아웃"
            >
              <FaBan />
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
