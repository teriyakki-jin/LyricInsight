import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';

export function Home() {
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('critic');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lyrics.trim()) {
      alert('가사를 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 실제 API 호출
      // const response = await fetch('http://localhost:8080/api/v1/analysis', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ lyrics, style }),
      // });
      // const data = await response.json();
      // navigate(`/result/${data.id}`);

      // Mock 응답 (실제 사용 시 위 주석 해제하고 아래 삭제)
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockId = Date.now().toString();
      navigate(`/result/${mockId}`, { state: { lyrics, style } });
    } catch (error) {
      console.error('분석 요청 실패:', error);
      alert('분석 요청에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-gray-900 mb-3 flex items-center justify-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-600" />
          노래 가사 해석
        </h1>
        <p className="text-gray-600">
          가사를 입력하면 AI가 감정, 주제, 의미를 분석해드립니다
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <label htmlFor="lyrics" className="block text-gray-900 mb-3">
            가사 입력
          </label>
          <textarea
            id="lyrics"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="분석하고 싶은 노래 가사를 입력해주세요..."
            className="w-full h-64 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900"
            disabled={isLoading}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <label htmlFor="style" className="block text-gray-900 mb-3">
            분석 스타일
          </label>
          <select
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 cursor-pointer"
            disabled={isLoading}
          >
            <option value="critic">비평가 (Critic) - 깊이 있는 문학적 분석</option>
            <option value="counselor">상담사 (Counselor) - 감정과 심리 중심</option>
            <option value="friend">친구 (Friend) - 편안하고 공감적인 해석</option>
            <option value="concise">간결 (Concise) - 핵심만 빠르게</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              가사 분석하기
            </>
          )}
        </button>
      </form>
    </div>
  );
}
