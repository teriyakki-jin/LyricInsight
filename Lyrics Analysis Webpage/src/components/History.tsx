import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, ListMusic } from 'lucide-react';

interface HistoryItem {
  id: string;
  createdAt: string;
  style: string;
  lyrics: string;
}

const styleLabels: Record<string, string> = {
  critic: '비평가',
  counselor: '상담사',
  friend: '친구',
  concise: '간결',
};

export function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 실제 API 호출
        // const response = await fetch('http://localhost:8080/api/v1/analysis/recent?limit=10');
        // const data = await response.json();
        // setHistory(data);

        // Mock 데이터 (실제 사용 시 위 주석 해제하고 아래 삭제)
        await new Promise(resolve => setTimeout(resolve, 600));
        const mockHistory: HistoryItem[] = [
          {
            id: '5',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            style: 'critic',
            lyrics: '너의 목소리가 들려와\n어둠 속에서도 빛이 되어\n내 마음을 비춰주던...',
          },
          {
            id: '4',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            style: 'friend',
            lyrics: '혼자인 밤이 두려워\n네가 없는 세상이 낯설어\n돌아올 수 있을까...',
          },
          {
            id: '3',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            style: 'counselor',
            lyrics: '시간이 지나면 잊혀질까\n이 아픔도 언젠간 무뎌질까\n하루하루가 힘들어...',
          },
          {
            id: '2',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            style: 'concise',
            lyrics: '사랑했던 기억들이\n하나씩 떠올라\n미소 짓게 만들어...',
          },
          {
            id: '1',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            style: 'critic',
            lyrics: '마지막 인사도 못 한 채\n돌아서야 했던 그날\n후회가 밀려와...',
          },
        ];
        setHistory(mockHistory);
      } catch (error) {
        console.error('기록 조회 실패:', error);
        alert('기록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

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
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-gray-500">기록을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2 flex items-center gap-3">
          <ListMusic className="w-8 h-8 text-indigo-600" />
          분석 기록
        </h1>
        <p className="text-gray-600">최근 분석한 가사 목록입니다</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <ListMusic className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">아직 분석 기록이 없습니다</p>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            첫 가사 분석하러 가기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/result/${item.id}`)}
              className="w-full bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                      {styleLabels[item.style] || item.style}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 line-clamp-2 leading-relaxed">
                    {item.lyrics}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
