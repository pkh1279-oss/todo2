interface Props {
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
  selected?: string;
}

export default function ChoiceButtons({ options, onSelect, disabled, selected }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 pl-10">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          disabled={disabled}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
            ${selected === opt
              ? 'bg-orange-400 text-white border-orange-400'
              : disabled
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:text-orange-500 cursor-pointer'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
