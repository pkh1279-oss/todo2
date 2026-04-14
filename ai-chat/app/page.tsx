'use client';

import { useState, useRef, useEffect } from 'react';
import ChatBubble from '@/components/ChatBubble';
import ChoiceButtons from '@/components/ChoiceButtons';
import RecommendCard from '@/components/RecommendCard';
import { FoodType, Situation, Mood, Recommendation } from '@/lib/prompt';

type Step = 'foodType' | 'situation' | 'mood' | 'loading' | 'result';

interface Message {
  id: number;
  role: 'bot' | 'user';
  text: string;
}

const FOOD_TYPES: FoodType[] = ['한식', '중식', '일식', '양식', '동남아', '상관없음'];
const SITUATIONS: Situation[] = ['혼밥', '친구와', '연인과', '가족과', '회식', '간단한 미팅'];
const MOODS: Mood[] = ['든든하게', '가볍게', '달달하게', '얼큰하게', '색다르게'];

let msgId = 0;
const newMsg = (role: 'bot' | 'user', text: string): Message => ({ id: msgId++, role, text });

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    newMsg('bot', '안녕하세요! 오늘 뭐 먹을지 고민되시나요?\n어떤 음식이 드시고 싶으세요?'),
  ]);
  const [step, setStep] = useState<Step>('foodType');
  const [selections, setSelections] = useState<{ foodType?: FoodType; situation?: Situation; mood?: Mood }>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedValues, setSelectedValues] = useState<{ foodType?: string; situation?: string; mood?: string }>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step]);

  function addMessages(...msgs: Message[]) {
    setMessages((prev) => [...prev, ...msgs]);
  }

  function handleFoodType(value: string) {
    const foodType = value as FoodType;
    setSelectedValues((v) => ({ ...v, foodType: value }));
    setSelections((s) => ({ ...s, foodType }));
    addMessages(
      newMsg('user', value),
      newMsg('bot', `${value === '상관없음' ? '장르 상관없이 골라드릴게요!' : `${value} 좋죠!`}\n어떤 상황에서 드세요?`),
    );
    setStep('situation');
  }

  function handleSituation(value: string) {
    const situation = value as Situation;
    setSelectedValues((v) => ({ ...v, situation: value }));
    setSelections((s) => ({ ...s, situation }));
    addMessages(
      newMsg('user', value),
      newMsg('bot', '오늘 기분은 어때요?'),
    );
    setStep('mood');
  }

  async function handleMood(value: string) {
    const mood = value as Mood;
    setSelectedValues((v) => ({ ...v, mood: value }));
    const finalSelections = { ...selections, mood };
    addMessages(newMsg('user', value));
    setStep('loading');

    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalSelections),
      });

      if (!res.ok) throw new Error();
      const data: Recommendation[] = await res.json();
      setRecommendations(data);
      addMessages(newMsg('bot', '딱 맞는 메뉴를 골라봤어요!'));
      setStep('result');
    } catch {
      addMessages(newMsg('bot', '앗, 추천을 불러오는 데 실패했어요. 다시 시도해주세요.'));
      setStep('mood');
    }
  }

  function handleReset() {
    setMessages([newMsg('bot', '안녕하세요! 오늘 뭐 먹을지 고민되시나요?\n어떤 음식이 드시고 싶으세요?')]);
    setStep('foodType');
    setSelections({});
    setSelectedValues({});
    setRecommendations([]);
  }

  return (
    <main className="flex flex-col items-center min-h-screen py-8 px-4">
      <div className="w-full max-w-md flex flex-col h-[calc(100vh-4rem)]">
        <h1 className="text-center text-xl font-bold text-orange-500 mb-4">오늘 뭐 먹지?</h1>

        <div className="flex-1 overflow-y-auto pb-4">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} role={msg.role} text={msg.text} />
          ))}

          {step === 'foodType' && (
            <ChoiceButtons
              options={FOOD_TYPES}
              onSelect={handleFoodType}
              selected={selectedValues.foodType}
            />
          )}
          {step === 'situation' && (
            <ChoiceButtons
              options={SITUATIONS}
              onSelect={handleSituation}
              selected={selectedValues.situation}
            />
          )}
          {step === 'mood' && (
            <ChoiceButtons
              options={MOODS}
              onSelect={handleMood}
              selected={selectedValues.mood}
            />
          )}
          {step === 'loading' && (
            <div className="pl-10 mb-4">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-orange-300 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
          {step === 'result' && (
            <RecommendCard recommendations={recommendations} onReset={handleReset} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </main>
  );
}
