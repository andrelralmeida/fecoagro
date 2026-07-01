interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function callOpenAI(
  messages: OpenAIMessage[],
  apiKey: string,
  model = 'gpt-4o-mini',
  temperature = 0.1,
): Promise<string | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature }),
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  }
}

export function parseJsonResponse(content: string): any {
  try {
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    return JSON.parse(cleaned)
  } catch {
    return null
  }
}

export function calculateStringSimilarity(s1: string, s2: string): number {
  const words1 = s1.toLowerCase().split(/\s+/).filter(Boolean)
  const words2 = s2.toLowerCase().split(/\s+/).filter(Boolean)
  if (words1.length === 0 || words2.length === 0) return 0
  const set1 = new Set(words1)
  const set2 = new Set(words2)
  let common = 0
  for (const w of set1) {
    if (set2.has(w)) common++
  }
  return common / Math.max(set1.size, set2.size)
}

export function ruleBasedScore(
  extrato: { data: string; descricao: string; valor: number },
  candidate: { date: string; historico: string | null; amount: number },
): { score: number; reasoning: string } {
  let score = 0
  const reasons: string[] = []

  const dateDiff =
    Math.abs(
      new Date(extrato.data).getTime() - new Date(candidate.date).getTime(),
    ) /
    (1000 * 60 * 60 * 24)

  const dateScore = Math.max(0, 30 - dateDiff * 6)
  score += dateScore
  if (dateDiff === 0) reasons.push('Datas identicas')
  else if (dateDiff <= 2)
    reasons.push(`Datas proximas (${dateDiff.toFixed(0)} dias)`)

  const valueDiff =
    Math.abs(extrato.valor - candidate.amount) /
    Math.max(Math.abs(extrato.valor), Math.abs(candidate.amount), 0.01)
  const valueScore = Math.max(0, 50 - valueDiff * 5000)
  score += valueScore
  if (valueDiff === 0) reasons.push('Valores identicos')
  else if (valueDiff < 0.0001) reasons.push('Valores praticamente identicos')

  const descSim = calculateStringSimilarity(
    extrato.descricao,
    candidate.historico || '',
  )
  score += descSim * 20
  if (descSim > 0.5) reasons.push('Descricoes com similaridade')

  return {
    score: Math.min(1, score / 100),
    reasoning: reasons.join('; ') || 'Correspondencia baseada em regras',
  }
}
