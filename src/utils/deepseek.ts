import type { Material, SubTask } from '../types';

const BASE_URL = 'https://api.deepseek.com/v1';

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function buildPrompt(taskTitle: string, materials: Material[]): string {
  const materialsSection =
    materials.length > 0
      ? materials
          .map(m => `【${m.name}】\n${m.content}`)
          .join('\n\n---\n\n')
      : '（无参考资料）';

  return `你是一位专业的ADHD教练，擅长把大任务拆解成极小的可执行步骤。

参考资料（根据这些资料让拆解更准确具体）：
---
${materialsSection}
---

需要拆解的任务：
${taskTitle}

拆解要求：
1. 每个最小子任务不超过 10-15 分钟
2. 第一个子任务必须是最简单、门槛最低的步骤，让人立刻能开始
3. 步骤要极度具体，不能有"思考一下"或"研究一下"这类模糊描述
4. 按照逻辑顺序分成 2-4 个父任务，每个父任务下有 3-6 个子任务
5. 语言简单直接，充满鼓励

只返回 JSON，不要任何 Markdown 或解释，格式如下：
{
  "title": "任务名称",
  "subtasks": [
    {
      "title": "父任务名称",
      "description": "这个阶段要完成什么",
      "estimatedMinutes": 45,
      "subtasks": [
        {
          "title": "具体小步骤",
          "description": "详细说明做什么，越具体越好",
          "estimatedMinutes": 10,
          "subtasks": []
        }
      ]
    }
  ]
}`;
}

function parseSubtasks(raw: unknown[]): SubTask[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item: unknown) => {
    const obj = item as Record<string, unknown>;
    return {
      id: uid(),
      title: String(obj.title ?? ''),
      description: String(obj.description ?? ''),
      estimatedMinutes: Number(obj.estimatedMinutes ?? 15),
      completed: false,
      subtasks: parseSubtasks((obj.subtasks as unknown[]) ?? []),
    };
  });
}

export async function breakdownTask(
  apiKey: string,
  taskTitle: string,
  materials: Material[],
  onChunk: (text: string) => void
): Promise<{ title: string; subtasks: SubTask[] }> {
  const prompt = buildPrompt(taskTitle, materials);

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API 错误 (${response.status}): ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          full += delta;
          onChunk(full);
        }
      } catch {
        // partial chunk, ignore
      }
    }
  }

  // Extract JSON from response (handle potential markdown code blocks)
  const jsonMatch = full.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 返回格式异常，请重试');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    title: String(parsed.title ?? taskTitle),
    subtasks: parseSubtasks(parsed.subtasks ?? []),
  };
}
