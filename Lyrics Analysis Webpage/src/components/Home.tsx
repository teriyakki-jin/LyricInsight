import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Music2, Loader2, PlayCircle, Search, Mic2 } from 'lucide-react';
import { analyzeLyrics, checkBackendConnection, apiUrl } from '../lib/api';
import { Skeleton } from './ui/Skeleton';

export function Home() {
  const [lyrics, setLyrics] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Search Mode States
  const [mode, setMode] = useState<'manual' | 'search'>('manual');
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [isChecking, setIsChecking] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!artist.trim() || !title.trim()) {
      alert('가수와 노래 제목을 모두 입력해주세요.');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(apiUrl(`/api/v1/lyrics/search?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`));
      if (!response.ok) throw new Error('가사를 찾을 수 없습니다.');

      const data = await response.json();
      setLyrics(data.lyrics);
      setMode('manual'); // Switch to manual mode to show result
    } catch (error) {
      console.error('가사 검색 실패:', error);
      alert('가사를 찾을 수 없습니다. 가수와 제목을 확인해주세요.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lyrics.trim()) {
      alert('가사를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const style = 'critic'; // Hardcoded default
      const data = await analyzeLyrics(lyrics, style);
      // data: { id, createdAt, emotions, ... }

      navigate(`/result/${data.id}`, {
        state: {
          lyrics,
          style,
          emotions: data.emotions ?? [],
          createdAt: data.createdAt,
          result: data.result
        }
      });
    } catch (error) {
      console.error('분석 요청 실패:', error);
      alert('분석 요청에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render Skeleton Overlay when loading (simulating Result page structure)
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 animate-fade-in min-h-[80vh] flex flex-col justify-center">
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-64 mx-auto mb-4 rounded-xl" />
          <Skeleton className="h-6 w-96 mx-auto rounded-lg" />
        </div>
        <div className="glass rounded-3xl p-8 border border-white/60">
          <div className="grid gap-8">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="grid md:grid-cols-2 gap-8">
              <Skeleton className="h-64 w-full rounded-3xl" />
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        </div>
        <div className="mt-8 text-center flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">AI가 가사를 깊이 있게 분석하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col justify-center min-h-[80vh] animate-fade-in">
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4 shadow-sm">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          노래 가사의 깊은 의미를<br />
          <span className="text-indigo-600">AI와 함께 발견하세요</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          좋아하는 노래의 가사를 입력하면 감정, 숨겨진 의미, 문학적 표현까지<br className="hidden sm:block" />
          다양한 관점에서 깊이 있게 분석해 드립니다.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={async () => {
              setIsChecking(true);
              setBackendStatus(null);
              try {
                const health = await checkBackendConnection();
                setBackendStatus(`연결 성공 (${health.status})`);
              } catch (error) {
                console.error('백엔드 연결 확인 실패:', error);
                setBackendStatus('연결 실패');
              } finally {
                setIsChecking(false);
              }
            }}
            className="px-4 py-2 rounded-full border border-indigo-200 text-indigo-600 bg-white/50 hover:bg-white text-sm font-medium transition-all flex items-center gap-2"
            disabled={isChecking}
          >
            <div className={`w-2 h-2 rounded-full ${backendStatus?.includes('성공') ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            {isChecking ? '서버 확인 중...' : '서버 상태 확인'}
          </button>
          {backendStatus && (
            <span className="text-sm text-gray-600 font-medium animate-fade-in">{backendStatus}</span>
          )}
        </div>
      </div>

      <div className="glass rounded-3xl shadow-xl p-1 border border-white/60">
        <div className="bg-white/40 rounded-[1.4rem] p-6 sm:p-10 backdrop-blur-sm">

          {/* Tabs */}
          <div className="flex p-1 bg-gray-100/50 rounded-xl mb-8 w-fit mx-auto">
            <button
              onClick={() => setMode('manual')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              직접 입력
            </button>
            <button
              onClick={() => setMode('search')}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${mode === 'search' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Search className="w-4 h-4" />
              가사 검색
            </button>
          </div>

          {mode === 'manual' ? (
            <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
              <div className="space-y-4">
                <label htmlFor="lyrics" className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                  <Music2 className="w-5 h-5 text-indigo-600" />
                  가사 입력
                </label>
                <div className="relative">
                  <textarea
                    id="lyrics"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="분석하고 싶은 노래 가사를 이곳에 붙여넣으세요..."
                    className="w-full h-64 px-6 py-5 bg-white border-0 ring-1 ring-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none text-gray-900 text-base leading-relaxed placeholder:text-gray-400 shadow-inner transition-shadow"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl hover:shadow-lg hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold text-lg shadow-indigo-500/25 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>AI가 분석 중입니다...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      <span>지금 분석하기</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8 animate-fade-in max-w-lg mx-auto py-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-gray-900 font-semibold flex items-center gap-2">
                    <Mic2 className="w-4 h-4 text-indigo-600" />
                    가수
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="예: 아이유"
                    className="w-full px-5 py-3.5 bg-white border-0 ring-1 ring-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 shadow-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-gray-900 font-semibold flex items-center gap-2">
                    <Music2 className="w-4 h-4 text-indigo-600" />
                    노래 제목
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 밤편지"
                    className="w-full px-5 py-3.5 bg-white border-0 ring-1 ring-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-gray-900 shadow-sm"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold text-lg flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>가사 찾는 중...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>가사 검색하기</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
