/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './app/**/*.{js,ts,jsx,tsx}',     // ✅ app 폴더 포함
      './pages/**/*.{js,ts,jsx,tsx}',   // (선택) pages 폴더도 쓰는 경우
      './components/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  };
  