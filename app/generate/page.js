'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  serverTimestamp,
  query,
  where,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { translateToEnglish } from '../../utils/translatePrompt';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function GeneratePage() {
  const [user, setUser] = useState(null);
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
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, 'userProfiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        const isAdmin = docSnap.exists() ? docSnap.data().isAdmin : false;
        setUser({ ...currentUser, isAdmin });
  
        if (isAdmin) {
          setUsageCount(0); // ✅ 관리자도 0으로 명시해줘야 안전
        } else {
          const usageRef = doc(db, 'usageLogs', currentUser.uid);
          const usageSnap = await getDoc(usageRef);
          const nowKST = dayjs().tz('Asia/Seoul');
          const todayMidnight = nowKST.startOf('day');
  
          if (!usageSnap.exists()) {
            setUsageCount(0);
          } else {
            const data = usageSnap.data();
            const lastReset = dayjs(data.resetDate.toDate());
            if (lastReset.isBefore(todayMidnight)) {
              setUsageCount(0);
            } else {
              setUsageCount(data.count || 0);
            }
          }
        }
      } else {
        setUser(null);
        setUsageCount(0);
      }
    });
  }, []);

  const buildNaturalPrompt = () => {
    return (
      `절대적으로 ${season} 시즌에 어울리는, ${gender} 전용 디자인이어야 합니다. ` +
      `컬러는 반드시 "${color}"여야 하고, 핏은 철저하게 "${fit}" 핏입니다. ` +
      `${fabric ? `소재는 반드시 "${fabric}"이어야 하며, ` : ''}` +
      `${pattern ? `"${pattern}" 패턴이 무조건 포함되어 있어야 합니다. ` : ''}` +
      `옷 종류는 "${type}"로 고정이며, 절대 다른 종류로 표현되어선 안 됩니다. ` +
      `스타일 무드는 "${mood}"로 한정하며, 스타일 타입은 "${styleType}"이어야만 합니다. ` +
      `${theme ? `테마는 "${theme}"로 제한됩니다. ` : ''}` +
      `${occasion ? `이 디자인은 "${occasion}" 목적을 철저히 반영해야 합니다. ` : ''}` +
      `${details ? `"${details}" 디테일은 필수이며, 반드시 시각적으로 명확히 표현되어야 합니다. ` : ''}` +
      `${accessory ? `악세서리는 반드시 "${accessory}"가 포함되어 있어야 합니다. ` : ''}` +
      `전체 이미지는 반드시 하얀 배경에서 촬영된 것처럼 보여야 하며, ` +
      `절대로 사람의 얼굴이 나타나선 안 됩니다. ` +
      `정면 샷으로 촬영되어야 하고, 소재의 질감은 디테일하게 표현되어야 하며, ` +
      `계절감을 강하게 느낄 수 있어야 하며, ` +
      `전체적으로 옷 자체에 집중된 스튜디오 화보 스타일로 철저히 연출되어야 합니다.`
    );
  };
  

  const handleGenerate = async () => {
    if (!user) return alert('로그인이 필요합니다.');
  
    setLoading(true);
    setImage(null);
  
    try {
      const nowKST = dayjs().tz('Asia/Seoul');
      const todayMidnight = nowKST.startOf('day');
      let currentCount = 0;
  
      if (!user.isAdmin) {
        const usageRef = doc(db, 'usageLogs', user.uid);
        const usageSnap = await getDoc(usageRef);
  
        if (!usageSnap.exists()) {
          await setDoc(usageRef, { count: 1, resetDate: todayMidnight.toDate() });
          setUsageCount(1);
        } else {
          const data = usageSnap.data();
          const lastReset = dayjs(data.resetDate.toDate());
          if (lastReset.isBefore(todayMidnight)) {
            await setDoc(usageRef, { count: 1, resetDate: todayMidnight.toDate() });
            setUsageCount(1);
          } else {
            currentCount = data.count;
            if (currentCount >= 5) {
              setLoading(false);
              return alert('이미지를 더 생성하려면 플랜을 업그레이드 하거나 12시 이후에 다시 시도해주세요.');
            }
            await updateDoc(usageRef, { count: currentCount + 1 });
            setUsageCount(currentCount + 1);
          }
        }
      }
  
      const koreanPrompt = customPrompt || buildNaturalPrompt();
      setPromptText(koreanPrompt);
      const translated = await translateToEnglish(koreanPrompt);
  
      const response = await fetch('https://generateimage-669367289017.us-central1.run.app/generate', {

        method: "POST", // ✅ 이 줄 꼭 필요!
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: translated,
          uid: user.uid,
        }),
      });
      
      
  
      const data = await response.json();
  
      if (data?.image) {
        setImage(data.image);
      } else {
        throw new Error('이미지가 생성되지 않았습니다.');
      }
  
    } catch (err) {
      console.error('❌ 이미지 생성 실패:', err);
      alert('이미지 생성 실패');
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
    <div
      className="relative min-h-screen text-white px-6 py-10 flex flex-col items-center overflow-hidden"
      style={{
        backgroundImage: 'url("/tribal-strong.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-70 z-0" />
      <div className="relative z-10 w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-purple-400 text-center">나만의 의류 디자인 생성하기</h1>
        {!user && <p className="text-red-400 mb-4 text-center">⚠️ 로그인 후 이용해 주세요.</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: '성별', value: gender, setValue: setGender, options: ['여성', '남성', '유니섹스'] },
            { label: '컬러', value: color, setValue: setColor, type: 'text', placeholder: '예: 어두운 보라' },
            { label: '무드', value: mood, setValue: setMood, options: ['키치', '로맨틱', '고딕', '모던', '스트리트','빈티지','보헤미안','아방가르드','캐주얼','시크'] },
            { label: '옷 종류', value: type, setValue: setType, options: ['셔츠', '드레스', '후드티', '점프수트','티셔츠','재킷','코트','원피스','스커트','팬츠','니트'] },
            { label: '핏', value: fit, setValue: setFit, options: ['오버핏', '슬림핏', '루즈핏'] },
            { label: '시즌', value: season, setValue: setSeason, options: ['봄', '여름', '가을', '겨울'] },
            { label: '소재', value: fabric, setValue: setFabric, options: ['레더', '코튼', '실크', '데님', '니트','다이마루','시스루','퍼'] },
            { label: '패턴', value: pattern, setValue: setPattern, options: ['무지', '체크', '스트라이프', '플로럴', '애니멀','페이즐리','카모플라주'] },
            { label: '상황/목적', value: occasion, setValue: setOccasion, type: 'text', placeholder: '예: 데일리룩' },
            { label: '악세서리 포함', value: accessory, setValue: setAccessory, type: 'text', placeholder: '예: 벨트, 포켓' },
            { label: '테마', value: theme, setValue: setTheme, type: 'text', placeholder: '예: 하이틴룩' },
            { label: '디테일 요소', value: details, setValue: setDetails, type: 'text', placeholder: '예: 프릴, 지퍼' },
         
          ].map((opt, i) =>
            opt.type === 'text'
              ? <TextInput key={i} {...opt} />
              : <SelectOption key={i} {...opt} />
          )}
        </div>

        <div className="mt-6">
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
  className="mt-6 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded text-white w-full"
>
  {loading
    ? '생성 중...'
    : user?.isAdmin
      ? 'AI에게 요청하기'
      : `AI에게 요청하기 (${usageCount}/5)`}
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
    </div>
  );
}

function SelectOption({ label, value, setValue, options }) {
  return (
    <div>
      <label className="text-sm text-gray-300 mb-1 block">{label}</label>
      <select value={value} onChange={(e) => setValue(e.target.value)} className="w-full bg-gray-800 p-2 rounded">
        <option value="">선택 안함</option>
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function TextInput({ label, value, setValue, placeholder }) {
  return (
    <div>
      <label className="text-sm text-gray-300 mb-1 block">{label}</label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-800 p-2 rounded"
      />
    </div>
  );
}
