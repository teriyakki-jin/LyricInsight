import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Heart, Tag, Lightbulb, Calendar } from 'lucide-react';
import { apiUrl } from '../lib/api';

type EmotionItem = { label: string; score: number };
type HighlightItem = { line: string; meaning: string; why: string };

interface AnalysisResult {
    id: string;
    createdAt: string;
    emotions: EmotionItem[];
    result?: {
        summary?: string[];
        themes?: string[];
        highlights?: HighlightItem[];
    } | null;
}

type LocationState = {
    lyrics?: string;
    style?: string;
    emotions?: EmotionItem[];
    createdAt?: string;
} | null;

export function Result() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;

    const [data, setData] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const createdAtText = useMemo(() => {
        if (!data?.createdAt) return '';
        const d = new Date(data.createdAt);
        if (Number.isNaN(d.getTime())) return data.createdAt;
        return d.toLocaleString('ko-KR');
    }, [data?.createdAt]);

    useEffect(() => {
        // ✅ 1) Home에서 state로 넘어온 emotions가 있으면 즉시 렌더
        if (state?.emotions?.length) {
            setData({
                id: id ?? 'unknown',
                createdAt: state.createdAt ?? new Date().toISOString(),
                emotions: state.emotions.map((e) => ({
                    label: e.label,
                    score: normalizeEmotionScore(e.score),
                })),
                result: null,
            });
            setIsLoading(false);
            return;
        }

        // ✅ 2) state가 없으면(새로고침/직접 URL 접속) GET fallback
        const fetchResult = async () => {
            if (!id) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(apiUrl(`/api/v1/analysis/${id}`));
                if (!response.ok) throw new Error(`결과 조회 실패: ${response.status}`);

                const result = await response.json();

                // 백엔드가 emotions를 최상위로 주든, result 안에 주든 둘 다 대응
                const emotionsRaw = (result.emotions ?? result.result?.emotions ?? []) as EmotionItem[];

                const mapped: AnalysisResult = {
                    id: String(result.id ?? id),
                    createdAt: result.createdAt ?? new Date().toISOString(),
                    emotions: emotionsRaw.map((e) => ({
                        label: e.label,
                        score: normalizeEmotionScore(e.score),
                    })),
                    // summary/themes/highlights는 나중에 붙이면 자동 표시됨
                    result: result.result ?? null,
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
    }, [id, state]);

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
                    <button onClick={() => navigate('/')} className="text-indigo-600 hover:text-indigo-700">
                        홈으로 돌아가기
                    </button>
                </div>
            </div>
        );
    }

    const hasSummary = !!data.result?.summary?.length;
    const hasThemes = !!data.result?.themes?.length;
    const hasHighlights = !!data.result?.highlights?.length;

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
                        <span>{createdAtText}</span>
                    </div>
                </div>

                {/* Summary 카드 (있으면 렌더, 없으면 안내 문구) */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-gray-900 mb-6 flex items-center gap-3">
                        <Lightbulb className="w-6 h-6 text-amber-500" />
                        3줄 요약
                    </h2>

                    {hasSummary ? (
                        <div className="space-y-4">
                            {data.result!.summary!.map((line, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                        {index + 1}
                                    </div>
                                    <p className="text-gray-700 pt-1">{line}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">요약은 아직 준비 중이에요. (현재는 감정 분석만 제공)</p>
                    )}
                </div>

                {/* Emotions */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-gray-900 mb-6 flex items-center gap-3">
                        <Heart className="w-6 h-6 text-rose-500" />
                        감정 분석
                    </h2>

                    {data.emotions.length ? (
                        <div className="space-y-4">
                            {data.emotions.map((emotion, index) => (
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
                    ) : (
                        <p className="text-gray-500">감정 결과가 없습니다.</p>
                    )}
                </div>

                {/* Themes */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-gray-900 mb-6 flex items-center gap-3">
                        <Tag className="w-6 h-6 text-emerald-500" />
                        주요 테마
                    </h2>

                    {hasThemes ? (
                        <div className="flex flex-wrap gap-3">
                            {data.result!.themes!.map((theme, index) => (
                                <span
                                    key={index}
                                    className="px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full border border-indigo-200"
                                >
                  {theme}
                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">테마 분석은 아직 준비 중이에요.</p>
                    )}
                </div>

                {/* Highlights */}
                <div className="space-y-6">
                    <h2 className="text-gray-900 flex items-center gap-3">
                        <SparklesIcon className="w-6 h-6 text-indigo-600" />
                        핵심 가사 해석
                    </h2>

                    {hasHighlights ? (
                        data.result!.highlights!.map((highlight, index) => (
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
                        ))
                    ) : (
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <p className="text-gray-500">핵심 해석은 아직 준비 중이에요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SparklesIcon({ className }: { className?: string }) {
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
    if (typeof score !== 'number') return 0;
    if (score <= 1) return Math.round(score * 100);
    return Math.round(score);
}
