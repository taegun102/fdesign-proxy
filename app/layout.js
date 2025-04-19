import '../styles/globals.css';
import NavBar from './components/NavBar';

export const metadata = {
  title: 'F_Design',
  description: 'AI 기반 패션 디자인 플랫폼',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}