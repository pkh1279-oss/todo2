export type FoodType = '한식' | '중식' | '일식' | '양식' | '동남아' | '상관없음';
export type Situation = '혼밥' | '친구와' | '연인과' | '가족과' | '회식' | '간단한 미팅';
export type Mood = '든든하게' | '가볍게' | '달달하게' | '얼큰하게' | '색다르게';

export interface UserSelections {
  foodType: FoodType;
  situation: Situation;
  mood: Mood;
}

export interface Recommendation {
  name: string;
  reason: string;
}

export function buildPrompt(selections: UserSelections): string {
  return `당신은 음식 메뉴 추천 전문가입니다.

사용자 정보:
- 원하는 음식 종류: ${selections.foodType}
- 식사 상황: ${selections.situation}
- 오늘의 기분: ${selections.mood}

위 조건에 딱 맞는 음식 메뉴 3가지를 추천해주세요.
각 메뉴에는 이름과 추천 이유(1~2문장)를 포함하세요.

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요:
[
  { "name": "메뉴이름", "reason": "추천 이유" },
  { "name": "메뉴이름", "reason": "추천 이유" },
  { "name": "메뉴이름", "reason": "추천 이유" }
]`;
}
