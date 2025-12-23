import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Tag, Lightbulb, Calendar } from 'lucide-react';
import { apiUrl } from '../lib/api';

interface AnalysisResult {
  id: string;
  createdAt: string;
  result: {
    summary: string[];
    emotions: { label: string; score: number }[];
    themes: string[];
    highlights: { line: string; meaning: string; why: string }[];
  };
}

export function Result() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) return;
      try {
        const response = await fetch(apiUrl(`/api/v1/analysis/${id}`));
        if (!response.ok) {
          throw new Error(`결과 조회 실패: ${response.status}`);
        }
        const result = await response.json();
        const mapped: AnalysisResult = {
          id: String(result.id),
          createdAt: result.createdAt,
          result: {
            summary: (result.result?.summary ?? []) as string[],
            emotions: (result.result?.emotions ?? []).map((emotion: { label: string; score: number }) => ({
              label: emotion.label,
              score: normalizeEmotionScore(emotion.score),
            })),
            themes: (result.result?.themes ?? []) as string[],
            highlights: (result.result?.highlights ?? []).map(
              (highlight: { line: string; meaning: string; why: string }) => ({
                line: highlight.line,
                meaning: highlight.meaning,
                why: highlight.why,
              })
            ),
          },
        };
        setData(mapped);
      } catch (error) {
        console.error('결과 조회 실패:', error);
        alert('결과를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-gray-500">분석 결과를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center">
          <p className="text-gray-600 mb-4">결과를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        새 분석하기
      </button>

      <div className="space-y-6">
        {/* 분석 정보 */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(data.createdAt).toLocaleString('ko-KR')}</span>
          </div>
        </div>

        {/* Summary 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-gray-900 mb-6 flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            3줄 요약
          </h2>
          <div className="space-y-4">
            {data.result.summary.map((line, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
                <p className="text-gray-700 pt-1">{line}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Emotions */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-gray-900 mb-6 flex items-center gap-3">
            <Heart className="w-6 h-6 text-rose-500" />
            감정 분석
          </h2>
          <div className="space-y-4">
            {data.result.emotions.map((emotion, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900">{emotion.label}</span>
                  <span className="text-indigo-600">{emotion.score}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${emotion.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Themes */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-gray-900 mb-6 flex items-center gap-3">
            <Tag className="w-6 h-6 text-emerald-500" />
            주요 테마
          </h2>
          <div className="flex flex-wrap gap-3">
            {data.result.themes.map((theme, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full border border-indigo-200"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="space-y-6">
          <h2 className="text-gray-900 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            핵심 가사 해석
          </h2>
          {data.result.highlights.map((highlight, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-8">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6 border-l-4 border-indigo-500">
                <p className="text-gray-900 italic">"{highlight.line}"</p>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-gray-900 mb-2">의미</h3>
                  <p className="text-gray-700">{highlight.meaning}</p>
                </div>
                <div>
                  <h3 className="text-gray-900 mb-2">해석 근거</h3>
                  <p className="text-gray-600">{highlight.why}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function normalizeEmotionScore(score: number) {
  if (score <= 1) return Math.round(score * 100);
  return Math.round(score);
}
