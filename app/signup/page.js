// app/signup/page.js
'use client';

import { useState } from 'react';
import { auth } from '../../firebase/firebaseConfig'; // 경로 주의!
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 pt-28">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-full max-w-md text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">회원가입</h2>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block mb-1">이메일</label>
            <input
              type="email"
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1">비밀번호</label>
            <input
              type="password"
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 p-2 rounded font-bold">
            가입하기
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-400">
          이미 계정이 있으신가요?{" "}
          <a href="/login" className="text-purple-400 hover:underline">
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}