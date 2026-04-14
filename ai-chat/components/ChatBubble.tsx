interface Props {
  role: 'bot' | 'user';
  text: string;
}

export default function ChatBubble({ role, text }: Props) {
  const isBot = role === 'bot';
  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}>
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white text-sm mr-2 shrink-0 mt-1">
          🍽
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
          isBot
            ? 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
            : 'bg-orange-400 text-white rounded-tr-sm'
        }`}
      >
        {text}
      </div>
    </div>
  );
}
