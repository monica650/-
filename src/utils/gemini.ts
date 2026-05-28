import type { Material, Phase, Day, DailyTask } from '../types';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'gemini-2.0-flash';

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export async function createProjectPlan(
  apiKey: string,
  title: string,
  totalDays: number,
  materials: Material[],
  onStatus: (msg: string) => void
): Promise<{ title: string; phases: Phase[]; days: Day[] }> {
  const materialsSection = materials.length > 0
    ? materials.map(m => `【${m.name}】\n${m.content}`).join('\n\n---\n\n')
    : '（无参考资料，请根据通用经验规划）';

  const effectiveDays = Math.min(totalDays, 60);

  const prompt = `你是专业的ADHD学习教练，擅长把大项目拆成每日可执行的计划。

参考资料：
---
${materialsSection}
---

项目：${title}
可用天数：${effectiveDays}天

制定每日计划要求：
1. 先划分3-5个阶段（phases），每阶段有名称、起止天数、简介
2. 为每天安排：
   - minTasks（今日必做）：2-3个，每个≤15分钟，极度具体
   - bonusTasks（加分任务）：1-2个，完成必做后可以做
3. 第1天第1个任务：5分钟内能完成的最简单入门步骤
4. 任务必须具体可执行：用"打开XX网站找到XXX"而非"了解XXX"
5. 难度循序渐进
${totalDays > 30 ? `6. 第${Math.min(30, effectiveDays)}天后可改为周目标（7天一组）` : ''}

只输出JSON，不要任何解释：
{
  "title": "项目名",
  "phases": [
    {"title": "阶段名", "startDay": 1, "endDay": 7, "description": "这阶段目标"}
  ],
  "days": [
    {
      "day": 1,
      "phase": "阶段名",
      "minTasks": [{"title": "具体任务描述", "estimatedMinutes": 10}],
      "bonusTasks": [{"title": "加分任务描述", "estimatedMinutes": 15}]
    }
  ]
}`;

  onStatus('AI 正在规划你的学习计划...');

  const response = await fetch(
    `${BASE_URL}/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `Gemini API 错误 (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson?.error?.message ?? errMsg;
    } catch { /* ignore */ }
    if (response.status === 400) errMsg = 'API Key 无效，请在设置里检查';
    if (response.status === 429) errMsg = '请求太频繁，请等1分钟后重试';
    if (response.status === 403) errMsg = 'API Key 没有权限，请确认已在 Google AI Studio 启用';
    throw new Error(errMsg);
  }

  onStatus('解析规划结果...');

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('AI 返回为空，请重试');

  const parsed = JSON.parse(text);

  const phases: Phase[] = ((parsed.phases ?? []) as Record<string, unknown>[]).map(p => ({
    title: String(p.title ?? ''),
    startDay: Number(p.startDay ?? 1),
    endDay: Number(p.endDay ?? 1),
    description: String(p.description ?? ''),
  }));

  const days: Day[] = ((parsed.days ?? []) as Record<string, unknown>[]).map(d => ({
    dayNum: Number(d.day ?? 1),
    phase: String(d.phase ?? ''),
    minTasks: ((d.minTasks ?? []) as Record<string, unknown>[]).map((t): DailyTask => ({
      id: uid(),
      title: String(t.title ?? ''),
      estimatedMinutes: Number(t.estimatedMinutes ?? 15),
      completed: false,
      isBonus: false,
    })),
    bonusTasks: ((d.bonusTasks ?? []) as Record<string, unknown>[]).map((t): DailyTask => ({
      id: uid(),
      title: String(t.title ?? ''),
      estimatedMinutes: Number(t.estimatedMinutes ?? 15),
      completed: false,
      isBonus: true,
    })),
  }));

  return { title: String(parsed.title ?? title), phases, days };
}
