const handleGenerate = async () => {
  if (!user) return alert('로그인이 필요합니다.');

  setLoading(true);
  setImage(null);

  try {
    const koreanPrompt = customPrompt || buildNaturalPrompt();
    setPromptText(koreanPrompt);

    const translated = await translateToEnglish(koreanPrompt);

    // 1단계: 예측 생성 요청
    const startRes = await fetch('/api/replicateGenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: translated }),
    });
    const startData = await startRes.json();

    if (!startData?.predictionId) throw new Error('예측 ID 없음');

    // 2단계: 상태 확인 반복
    let status = null;
    const maxWait = 55;
    for (let i = 0; i < maxWait; i++) {
      const statusRes = await fetch('/api/replicateStatus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predictionId: startData.predictionId }),
      });
      status = await statusRes.json();

      if (status.status === 'succeeded') break;
      if (status.status === 'failed') throw new Error('이미지 생성 실패');

      await new Promise((r) => setTimeout(r, 1000));
    }

    if (status.status !== 'succeeded' || !status.output?.[0]) {
      throw new Error('이미지 생성 실패');
    }

    setImage(status.output[0]);
  } catch (err) {
    console.error('❌ 이미지 생성 실패:', err);
    alert('이미지 생성 실패');
  } finally {
    setLoading(false);
  }
};
