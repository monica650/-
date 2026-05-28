import type { Material, Phase, Day, DailyTask } from '../types';

const BASE_URL = 'https://api.deepseek.com/v1';

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function extractJson(text: string): string {
  // Strip markdown code fences
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Find outermost JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text;
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
    : '（无参考资料，根据通用经验规划）';

  const effectiveDays = Math.min(totalDays, 60);

  const prompt = `你是专业的ADHD学习教练，把大项目拆成每日清单。

参考资料：
---
${materialsSection}
---

项目：${title}
总天数：${effectiveDays}天

要求：
1. 划分3-5个阶段（phases），每阶段有名称/起止天/简介
2. 每天安排：
   - minTasks（今日必做）2-3个，每个≤15分钟，极度具体可执行
   - bonusTasks（加分任务）1-2个
3. 第1天第1个任务：5分钟内能完成的最简单入门步骤
4. 任务必须具体："打开XX找到XXX练习"而不是"了解XXX"
5. 循序渐进，从最简单开始
${totalDays > 30 ? `6. 第${Math.min(30, effectiveDays)}天后可改为周目标形式` : ''}

返回纯JSON（不要markdown代码块，不要注释）：
{
  "title": "项目名",
  "phases": [
    {"title": "阶段名", "startDay": 1, "endDay": 7, "description": "目标描述"}
  ],
  "days": [
    {
      "day": 1,
      "phase": "阶段名",
      "minTasks": [{"title": "具体任务", "estimatedMinutes": 10}],
      "bonusTasks": [{"title": "加分任务", "estimatedMinutes": 15}]
    }
  ]
}`;

  onStatus('DeepSeek R1 正在规划你的学习计划...');

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-reasoner',
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      temperature: 0.6,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `DeepSeek API 错误 (${response.status})`;
    try {
      const j = JSON.parse(errText);
      errMsg = j?.error?.message ?? errMsg;
    } catch { /* ignore */ }
    if (response.status === 401) errMsg = 'API Key 无效，请在设置里检查';
    if (response.status === 429) errMsg = '账户余额不足或请求太频繁，请稍后重试';
    throw new Error(errMsg);
  }

  onStatus('解析规划结果...');

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content ?? '';
  if (!raw) throw new Error('AI 返回为空，请重试');

  const jsonStr = extractJson(raw);
  const parsed = JSON.parse(jsonStr);

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
