import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, ListMusic, Trash2 } from 'lucide-react';
import { apiUrl, deleteAnalysis } from '../lib/api';

interface HistoryItem {
  id: string;
  createdAt: string;
  style: string;
  lyricsPreview?: string;
}


export function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      const response = await fetch(apiUrl('/api/v1/analysis/recent?limit=50'));
      if (!response.ok) {
        throw new Error(`기록 조회 실패: ${response.status}`);
      }
      const data = await response.json();
      setHistory(
        (data.items ?? []).map(
          (item: { id: number; createdAt: string; style: string; lyricsPreview?: string }) => ({
            id: String(item.id),
            createdAt: item.createdAt,
            style: item.style,
            lyricsPreview: item.lyricsPreview,
          })
        )
      );
    } catch (error) {
      console.error('기록 조회 실패:', error);
      alert('기록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;

    try {
      await deleteAnalysis(id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium animate-pulse">기록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      <div className="mb-8 ml-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <ListMusic className="w-8 h-8 text-indigo-600" />
          분석 기록
        </h1>
        <p className="text-gray-600 font-medium pl-11">최근 분석한 가사 목록입니다</p>
      </div>

      {history.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border-white/60">
          <ListMusic className="w-16 h-16 text-indigo-200 mx-auto mb-6" />
          <p className="text-gray-600 mb-6 text-lg">아직 분석 기록이 없습니다</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold shadow-lg shadow-indigo-200"
          >
            첫 가사 분석하러 가기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/result/${item.id}`)}
              className="w-full glass rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all text-left group border border-white/60 duration-300 cursor-pointer overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="삭제하기"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-700 line-clamp-2 leading-relaxed font-medium bg-white/40 p-3 rounded-lg">
                    {item.lyricsPreview ? `"${item.lyricsPreview}"` : '가사 미리보기가 없습니다.'}
                  </p>
                </div>
                <div className="flex h-full items-center pt-8">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
