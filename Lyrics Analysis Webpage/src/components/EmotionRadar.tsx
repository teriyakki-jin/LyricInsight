import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

type EmotionData = {
    label: string;
    score: number;
    fullMark: number;
};

interface EmotionRadarProps {
    data: EmotionData[];
}

export function EmotionRadar({ data }: EmotionRadarProps) {
    // 차트에 맞게 데이터 순서 조정하거나 가공 가능
    // 현재는 그대로 사용

    return (
        <div className="w-full h-[300px] sm:h-[350px] relative">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                    <PolarAngleAxis
                        dataKey="label"
                        tick={{ fill: '#4b5563', fontSize: 13, fontWeight: 600 }}
                    />
                    <Radar
                        name="감정 점수"
                        dataKey="score"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fill="#818cf8"
                        fillOpacity={0.5}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            color: '#1f2937'
                        }}
                        itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                        formatter={(value: number) => [`${value}점`, '점수']}
                    />
                </RadarChart>
            </ResponsiveContainer>

            {/* 중앙 장식용 또는 애니메이션 요소 추가 가능 */}
            <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
            >
                <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            </motion.div>
        </div>
    );
}
