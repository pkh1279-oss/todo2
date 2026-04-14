import { Recommendation } from '@/lib/prompt';

interface Props {
  recommendations: Recommendation[];
  onReset: () => void;
}

export default function RecommendCard({ recommendations, onReset }: Props) {
  return (
    <div className="pl-10 mb-4">
      <div className="bg-white rounded-2xl shadow-sm p-4 max-w-[80%]">
        <p className="text-sm font-semibold text-orange-500 mb-3">오늘의 추천 메뉴 3선</p>
        <div className="space-y-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-orange-400 font-bold text-sm shrink-0">{i + 1}.</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{rec.name}</p>
                <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{rec.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onReset}
        className="mt-3 px-4 py-2 bg-orange-400 text-white text-sm rounded-full hover:bg-orange-500 transition-colors cursor-pointer"
      >
        다시 추천받기
      </button>
    </div>
  );
}
