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

  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, 'userProfiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        const isAdmin = docSnap.exists() ? docSnap.data().isAdmin : false;
        setUser({ ...currentUser, isAdmin });

        if (isAdmin) {
          setUsageCount(0);
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
      `This is a strictly ${gender} only fashion design for the ${season} season. ` +
      `The color must be "${color}", no other colors allowed. The fit must strictly be "${fit}" fit. ` +
      `${fabric ? `The material must be "${fabric}", and it must be clearly visible. ` : ''}` +
      `${pattern ? `It must include the pattern "${pattern}" clearly on the fabric. ` : ''}` +
      `The garment type is strictly "${type}", no other types are acceptable. ` +
      `The mood must be "${mood}", and it must visually reflect this mood in every detail. ` +
      `${styleType ? `The style type must be "${styleType}", and no deviation is allowed. ` : ''}` +
      `${theme ? `The theme is "${theme}", and it must be the only theme visible. ` : ''}` +
      `${occasion ? `This design is meant for "${occasion}", and should be perfectly suited for that. ` : ''}` +
      `${details ? `It must include "${details}" details prominently displayed. ` : ''}` +
      `${accessory ? `Accessories like "${accessory}" must be included and visible. ` : ''}` +
      `The image must be taken in a white studio background, full-body front view only. ` +
      `No faces are allowed. Only the garment is visible, centered. ` +
      `The fabric texture must be highly detailed. ` +
      `It must have a strong seasonal feel of ${season}. ` +
      `Style must reflect the "Jirai Kei" (지뢰계) aesthetic: sickly pale, black lace, edgy, with gothic punk elements. ` +
      `Never include modern casual or normal styles. This is a subculture look. ` +
      `The output must be a high-quality fashion magazine style image focused strictly on the clothes.`
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

      const generateRes = await fetch("https://generateimage-669367289017.us-central1.run.app/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: translated, uid: user.uid }),
      });

      const genData = await generateRes.json();
      if (!genData?.image) throw new Error('이미지 생성 실패');

      setImage(genData.image);

    } catch (err) {
      console.error('❌ 이미지 생성 실패:', err);
      alert('이미지 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleEditImage = async () => {
    if (!editPrompt.trim() || !image) return alert('수정할 프롬프트를 입력하세요.');

    setLoading(true);

    try {
      const translatedEditPrompt = await translateToEnglish(editPrompt);

      const editRes = await fetch("https://generateimage-669367289017.us-central1.run.app/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: translatedEditPrompt, image }),
      });

      const editData = await editRes.json();
      if (!editData?.image) throw new Error('수정 이미지 생성 실패');

      setImage(editData.image);
      setIsEditing(false);
      setEditPrompt('');
      setPromptText(editPrompt);
    } catch (err) {
      console.error('❌ 이미지 수정 실패:', err);
      alert('이미지 수정 실패');
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
          {[{ label: '성별', value: gender, setValue: setGender, options: ['여성', '남성', '유니섹스'] }, { label: '컬러', value: color, setValue: setColor, type: 'text', placeholder: '예: 어두운 보라' }, { label: '무드', value: mood, setValue: setMood, options: ['키치', '로맨틱', '고딕', '모던', '스트리트','빈티지','보헤미안','아방가르드','캐주얼','시크'] }, { label: '옷 종류', value: type, setValue: setType, options: ['셔츠', '드레스', '후드티', '점프수트','티셔츠','재킷','코트','원피스','스커트','팬츠','니트'] }, { label: '핏', value: fit, setValue: setFit, options: ['오버핏', '슬림핏', '루즈핏'] }, { label: '시즌', value: season, setValue: setSeason, options: ['봄', '여름', '가을', '겨울'] }, { label: '소재', value: fabric, setValue: setFabric, options: ['레더', '코튼', '실크', '데님', '니트','다이마루','시스루','퍼'] }, { label: '패턴', value: pattern, setValue: setPattern, options: ['무지', '체크', '스트라이프', '플로럴', '애니멀','페이즐리','카모플라주'] }, { label: '상황/목적', value: occasion, setValue: setOccasion, type: 'text', placeholder: '예: 데일리룩' }, { label: '악세서리 포함', value: accessory, setValue: setAccessory, type: 'text', placeholder: '예: 벨트, 포켓' }, { label: '테마', value: theme, setValue: setTheme, type: 'text', placeholder: '예: 하이틴룩' }, { label: '디테일 요소', value: details, setValue: setDetails, type: 'text', placeholder: '예: 프릴, 지퍼' }].map((opt, i) =>
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
              <button onClick={() => setIsEditing(!isEditing)} className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded text-sm">✏️ 이미지 수정</button>
            </div>

            {isEditing && (
              <div className="mt-4">
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="추가 수정 프롬프트를 입력하세요."
                  className="w-full bg-gray-800 p-2 rounded h-24"
                />
                <button
                  onClick={handleEditImage}
                  disabled={loading}
                  className="mt-2 bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-white w-full"
                >
                  {loading ? '수정 중...' : '수정된 이미지 생성'}
                </button>
              </div>
            )}
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
