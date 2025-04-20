'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '../../firebase/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { FaBell, FaUser } from 'react-icons/fa';

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
      <div className="flex items-center gap-4 text-xl">
        <Link href="/" className="hover:text-purple-400">
          🏠
        </Link>

        {!user ? (
          <Link href="/login" className="hover:text-purple-400">
            🔐
          </Link>
        ) : (
          <>
            <Link href="/generate" className="hover:text-purple-400">
              ✏️
            </Link>
            <Link href="/gallery" className="hover:text-purple-400">
              🖼️
            </Link>
            <Link href="/playground" className="hover:text-purple-400">
              🎨
            </Link>
            <Link
              href="/notifications"
              className="hover:text-purple-400 flex items-center gap-1"
            >
              <FaBell />
            </Link>
            <Link
              href="/profile"
              className="hover:text-purple-400 flex items-center gap-1 text-sm"
            >
              <FaUser />
              {user.displayName || '프로필'}
            </Link>
            <button
              onClick={handleLogout}
              className="hover:text-red-400 text-xl"
              title="로그아웃"
            >
              🚫
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

