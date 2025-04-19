'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { translateToEnglish } from '../../utils/translatePrompt';

export default function GeneratePage() {
  const [user, setUser] = useState(null);

  // 옵션 state
  const [gender, setGender] = useState('여성');
  const [color, setColor] = useState('');
  const [mood, setMood] = useState('로맨틱');
  const [type, setType] = useState('셔츠');
  const [fit, setFit] = useState('오버핏');
  const [season, setSeason] = useState('봄');
  const [theme, setTheme] = useState('');
  const [details, setDetails] = useState('');
  const [fabric, setFabric] = useState('');
  const [styleType, setStyleType] = useState('');
  const [pattern, setPattern] = useState('');
  const [occasion, setOccasion] = useState('');
  const [accessory, setAccessory] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [promptText, setPromptText] = useState('');

  useEffect(() => {
    onAuthStateChanged(auth, setUser);
  }, []);

  const buildNaturalPrompt = () => {
    return (
      `${season} 시즌에 어울리는 ${gender}용 ${color} 컬러의 ${fit} 핏 ${fabric ? fabric + ' 소재의 ' : ''}` +
      `${pattern ? pattern + ' 패턴이 들어간 ' : ''}${type} 디자인입니다. ` +
      `스타일은 ${mood} 무드와 ${styleType} 스타일로 구성되었고, ` +
      `${theme ? `테마는 ${theme}이며, ` : ''}` +
      `${occasion ? `사용 목적은 ${occasion}입니다. ` : ''}` +
      `${details ? `디테일 요소로는 ${details}가 있으며, ` : ''}` +
      `${accessory ? `악세서리로는 ${accessory}가 포함되어 있습니다. ` : ''}` +
      `하얀 배경, 사람 얼굴 없음, 정면 샷, 디테일한 재질 표현, 계절감 강조, 의류 중심의 스튜디오 촬영 스타일로 구성해주세요.`
    );
  };

  const handleGenerate = async () => {
    if (!user) return alert('로그인이 필요합니다.');

    setLoading(true);
    setImage(null);

    try {
      const koreanPrompt = customPrompt || buildNaturalPrompt();
      setPromptText(koreanPrompt);

      const translated = await translateToEnglish(koreanPrompt);

      // Step 1: prediction 생성 요청
      const predictionRes = await fetch('/api/replicateGenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: translated }),
      });

      const predictionData = await predictionRes.json();
      if (!predictionData?.id) throw new Error('예측 ID를 받지 못했습니다.');

      // Step 2: Polling으로 상태 확인
      let attempts = 0;
      const maxAttempts = 50;
      let imageUrl = null;

      while (attempts < maxAttempts) {
        const statusRes = await fetch('/api/replicateStatus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: predictionData.id }),
        });

        const statusData = await statusRes.json();
        if (statusData.status === 'succeeded') {
          imageUrl = statusData.image;
          break;
        } else if (statusData.status === 'failed') {
          throw new Error('이미지 생성 실패');
        }

        await new Promise((res) => setTimeout(res, 1500));
        attempts++;
      }

      if (!imageUrl) throw new Error('이미지 생성 시간 초과');
      setImage(imageUrl);
    } catch (err) {
      console.error('❌ 이미지 생성 실패:', err);
      alert('이미지 생성 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveToGallery = async () => {
    if (!user || !image) return;

    const tagsArray = [mood, gender, type, season, fabric, styleType, pattern, occasion].filter(Boolean);
    await addDoc(collection(db, 'userImages'), {
      uid: user.uid,
      url: image,
      prompt: promptText,
      tags: tagsArray,
      createdAt: serverTimestamp(),
    });
    alert('갤러리에 저장되었습니다!');
  };

  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = image;
    link.download = 'generated_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-purple-400">나만의 의류 디자인 생성하기</h1>

      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 옵션 폼 생략: 이전처럼 유지 가능 */}
      </div>

      <div className="w-full max-w-2xl mt-6">
        <label className="text-sm text-gray-300 mb-1 block">직접 입력 (선택)</label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="직접 프롬프트를 입력하고 싶다면 여기에 입력하세요."
          className="w-full bg-gray-800 p-2 rounded h-24"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="mt-6 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded text-white"
      >
        {loading ? '생성 중...' : 'AI에게 요청하기'}
      </button>

      {image && (
        <div className="mt-10 text-center">
          <img src={image} alt="생성 이미지" className="rounded-lg shadow-lg border border-gray-600" />
          <div className="mt-4 flex gap-4 justify-center">
            <button onClick={downloadImage} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">📥 사진 저장</button>
            <button onClick={saveToGallery} className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded text-sm">💾 갤러리에 저장</button>
          </div>
        </div>
      )}
    </div>
  );
}
