import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Heart, Tag, Lightbulb, Calendar, Quote, Sparkles, Share2, Check } from 'lucide-react';
import { apiUrl } from '../lib/api';
import { Skeleton } from './ui/Skeleton';

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
    result?: AnalysisResult['result'];
} | null;

export function Result() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;

    const [data, setData] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);

    const createdAtText = useMemo(() => {
        if (!data?.createdAt) return '';
        const d = new Date(data.createdAt);
        if (Number.isNaN(d.getTime())) return data.createdAt;
        return d.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, [data?.createdAt]);

    useEffect(() => {
        if (state?.emotions?.length) {
            setData({
                id: id ?? 'unknown',
                createdAt: state.createdAt ?? new Date().toISOString(),
                emotions: state.emotions.map((e) => ({
                    label: e.label,
                    score: normalizeEmotionScore(e.score),
                })),
                result: state.result ?? null,
            });
            setIsLoading(false);
            return;
        }

        const fetchResult = async () => {
            if (!id) {
                setIsLoading(false);
                return;
            }

            try {
                // Simulate min loading time for skeleton effect
                const [response] = await Promise.all([
                    fetch(apiUrl(`/api/v1/analysis/${id}`)),
                    new Promise(resolve => setTimeout(resolve, 800))
                ]);

                if (!response.ok) throw new Error(`결과 조회 실패: ${response.status}`);

                const result = await response.json();
                const emotionsRaw = (result.emotions ?? result.result?.emotions ?? []) as EmotionItem[];

                const mapped: AnalysisResult = {
                    id: String(result.id ?? id),
                    createdAt: result.createdAt ?? new Date().toISOString(),
                    emotions: emotionsRaw.map((e) => ({
                        label: e.label,
                        score: normalizeEmotionScore(e.score),
                    })),
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

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
                <div className="mb-8">
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
                <div className="grid gap-6 sm:gap-8">
                    <Skeleton className="h-32 w-full rounded-3xl" />
                    <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                        <Skeleton className="h-80 w-full rounded-3xl" />
                        <Skeleton className="h-80 w-full rounded-3xl" />
                    </div>
                    <Skeleton className="h-40 w-full rounded-3xl" />
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-48 mb-4" />
                        <Skeleton className="h-64 w-full rounded-3xl" />
                        <Skeleton className="h-64 w-full rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="max-w-5xl mx-auto px-6 py-12 min-h-[60vh] flex flex-col items-center justify-center">
                <div className="glass p-8 rounded-2xl text-center max-w-md w-full">
                    <p className="text-gray-600 mb-6 text-lg">결과를 찾을 수 없습니다.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                    >
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in pb-24">
            <button
                onClick={() => navigate('/')}
                className="group flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 sm:mb-8 transition-colors px-3 sm:px-4 py-2 rounded-lg hover:bg-white/50 w-fit touch-manipulation"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium text-sm sm:text-base">새 분석하기</span>
            </button>

            <div className="grid gap-6 sm:gap-8">
                {/* 헤더 정보 */}
                <div className="glass rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/60">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">분석 결과 리포트</h1>
                        <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm font-medium bg-white/50 px-3 py-1 rounded-full w-fit">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{createdAtText}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/60 hover:bg-white text-indigo-600 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 sm:self-center self-start"
                    >
                        {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        <span className="font-medium text-sm">{isCopied ? '복사됨!' : '공유하기'}</span>
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                    {/* Summary 카드 */}
                    <div className="glass rounded-3xl p-6 sm:p-8 border border-white/60 hover:shadow-lg transition-shadow bg-gradient-to-br from-white/60 to-white/30">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            3줄 요약
                        </h2>

                        {hasSummary ? (
                            <div className="space-y-3 sm:space-y-4">
                                {data.result!.summary!.map((line, index) => (
                                    <div key={index} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-white/40 border border-white/50">
                                        <div className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mt-0.5 shadow-md shadow-indigo-200">
                                            {index + 1}
                                        </div>
                                        <p className="text-gray-800 leading-relaxed font-medium text-sm sm:text-base">{line}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl">
                                <p className="text-sm">요약 정보 준비 중</p>
                            </div>
                        )}
                    </div>

                    {/* Emotions 카드 */}
                    <div className="glass rounded-3xl p-6 sm:p-8 border border-white/60 hover:shadow-lg transition-shadow bg-gradient-to-br from-white/60 to-white/30">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            감정 분석
                        </h2>

                        {data.emotions.length ? (
                            <div className="space-y-5 sm:space-y-6">
                                {data.emotions.map((emotion, index) => (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-gray-900 font-medium text-sm sm:text-base">{emotion.label}</span>
                                            <span className="text-indigo-600 font-bold text-sm sm:text-base">{emotion.score}%</span>
                                        </div>
                                        <div className="h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${emotion.score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-40 flex items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl">
                                <p className="text-sm">감정 분석 결과 없음</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Themes 카드 */}
                <div className="glass rounded-3xl p-6 sm:p-8 border border-white/60 hover:shadow-lg transition-shadow bg-white/40">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        주요 테마
                    </h2>

                    {hasThemes ? (
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {data.result!.themes!.map((theme, index) => (
                                <span
                                    key={index}
                                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white shadow-sm text-indigo-700 rounded-full border border-indigo-100 font-medium hover:scale-105 transition-transform cursor-default text-sm sm:text-base"
                                >
                                    #{theme}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">테마 정보 준비 중</p>
                    )}
                </div>

                {/* Highlights */}
                <div className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3 px-2">
                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                        핵심 가사 해석
                    </h2>

                    {hasHighlights ? (
                        <div className="grid gap-6">
                            {data.result!.highlights!.map((highlight, index) => (
                                <div key={index} className="glass rounded-3xl p-6 sm:p-8 border border-white/60 hover:shadow-xl transition-all duration-300">
                                    <div className="bg-indigo-50/50 rounded-2xl p-5 sm:p-6 mb-6 border-l-4 border-indigo-500 relative">
                                        <Quote className="absolute top-4 left-4 w-6 h-6 sm:w-8 sm:h-8 text-indigo-200 -z-10 opacity-50" />
                                        <p className="text-gray-900 text-base sm:text-lg font-medium leading-relaxed italic relative z-10">"{highlight.line}"</p>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                                        <div>
                                            <h3 className="text-gray-900 font-bold mb-2 flex items-center gap-2 text-sm sm:text-base">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                의미
                                            </h3>
                                            <p className="text-gray-700 leading-relaxed bg-white/30 p-3 sm:p-4 rounded-xl text-sm sm:text-base">{highlight.meaning}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-gray-900 font-bold mb-2 flex items-center gap-2 text-sm sm:text-base">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                해석 근거
                                            </h3>
                                            <p className="text-gray-600 leading-relaxed bg-white/30 p-3 sm:p-4 rounded-xl text-sm sm:text-base">{highlight.why}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass rounded-3xl p-12 text-center text-gray-500">
                            <p className="text-sm">핵심 해석 정보 준비 중</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function normalizeEmotionScore(score: number) {
    if (typeof score !== 'number') return 0;
    if (score <= 1) return Math.round(score * 100);
    return Math.round(score);
}
