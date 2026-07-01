import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  callOpenAI,
  parseJsonResponse,
  ruleBasedScore,
} from '../_shared/ai-helpers.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { bank_id, date_from, date_to } = await req.json()
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Concurrency: check for recent AI processing (2 min window)
    let concurrencyQuery = adminClient
      .from('extratos_bancarios')
      .select('id')
      .not('ai_processed_at', 'is', null)
      .gt('ai_processed_at', new Date(Date.now() - 2 * 60 * 1000).toISOString())
      .eq('reconciled', false)
    if (bank_id) concurrencyQuery = concurrencyQuery.eq('banco_id', bank_id)
    const { data: processing } = await concurrencyQuery.limit(1)
    if (processing && processing.length > 0) {
      return new Response(
        JSON.stringify({
          status: 'already_processing',
          message: 'Processamento de IA em andamento. Aguarde.',
          summary: {
            autoReconciled: 0,
            suggested: 0,
            manualReview: 0,
            total: 0,
          },
          suggestions: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch all plano_contas to determine analytic account IDs
    // An account is analytic if no other account's classification starts with its classification + '.'
    const { data: allPlanoContas } = await adminClient
      .from('plano_contas')
      .select('id, classificacao, tipo')

    const analyticAccountIds = new Set<number>()
    const allClassifications = (allPlanoContas || []).map(
      (a) => a.classificacao || '',
    )
    for (const acct of allPlanoContas || []) {
      const prefix = (acct.classificacao || '') + '.'
      const hasChildren = allClassifications.some((c) => c.startsWith(prefix))
      if (!hasChildren) {
        analyticAccountIds.add(acct.id)
      }
    }

    // Fetch unreconciled extratos without prior high-confidence AI match
    let extratosQuery = adminClient
      .from('extratos_bancarios')
      .select('*')
      .eq('reconciled', false)
      .or('ai_confidence.is.null,ai_confidence.lt.0.6')
    if (bank_id) extratosQuery = extratosQuery.eq('banco_id', bank_id)
    if (date_from) extratosQuery = extratosQuery.gte('data', date_from)
    if (date_to) extratosQuery = extratosQuery.lte('data', date_to)
    const { data: extratos, error: extratosError } = await extratosQuery.order(
      'data',
      { ascending: false },
    )
    if (extratosError) throw extratosError

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    let autoReconciled = 0,
      suggested = 0,
      manualReview = 0
    const suggestions: any[] = []

    for (const extrato of extratos || []) {
      // Fuzzy filter: ±5 days, ±0.01% value variance
      const dFrom = new Date(extrato.data)
      dFrom.setDate(dFrom.getDate() - 5)
      const dTo = new Date(extrato.data)
      dTo.setDate(dTo.getDate() + 5)
      const vMin = extrato.valor * 0.9999,
        vMax = extrato.valor * 1.0001

      const { data: rawCandidates } = await adminClient
        .from('critica')
        .select('*')
        .eq('reconciled', false)
        .gte('date', dFrom.toISOString().split('T')[0])
        .lte('date', dTo.toISOString().split('T')[0])
        .gte('amount', vMin)
        .lte('amount', vMax)
        .limit(10)

      // Filter candidates to only include those with null or analytic plano_conta_id
      const candidates = (rawCandidates || [])
        .filter(
          (c) => !c.plano_conta_id || analyticAccountIds.has(c.plano_conta_id),
        )
        .slice(0, 5)

      if (candidates.length === 0) {
        manualReview++
        await adminClient
          .from('extratos_bancarios')
          .update({
            ai_reasoning: 'Nenhum candidato encontrado.',
            ai_processed_at: new Date().toISOString(),
          })
          .eq('id', extrato.id)
        continue
      }

      let bestMatch: {
        score: number
        reasoning: string
        candidate: any
      } | null = null

      if (apiKey) {
        const candDesc = candidates
          .map(
            (c: any, i: number) =>
              `${i + 1}. ID:${c.id} Data:${c.date} Valor:${c.amount} Hist:${c.historico || 'N/A'}`,
          )
          .join('\n')
        const sys =
          'You are a financial reconciliation expert. Evaluate if a bank statement matches an accounting record. Return JSON: {"best_match_index":number_or_null,"confidence":0_to_1,"reasoning":"brief"}'
        const usr = `Bank:\nDate:${extrato.data}\nDesc:${extrato.descricao}\nVal:${extrato.valor}\nType:${extrato.tipo}\n\nCandidates:\n${candDesc}`
        const content = await callOpenAI(
          [
            { role: 'system', content: sys },
            { role: 'user', content: usr },
          ],
          apiKey,
        )
        if (content) {
          const parsed = parseJsonResponse(content)
          if (parsed && parsed.best_match_index != null) {
            const idx = parsed.best_match_index - 1
            if (idx >= 0 && idx < candidates.length) {
              bestMatch = {
                score: parsed.confidence,
                reasoning: parsed.reasoning,
                candidate: candidates[idx],
              }
            }
          }
        }
      }

      if (!bestMatch) {
        let bestScore = 0
        for (const c of candidates) {
          const r = ruleBasedScore(extrato, c)
          if (r.score > bestScore) {
            bestScore = r.score
            bestMatch = { ...r, candidate: c }
          }
        }
      }

      if (!bestMatch?.candidate) {
        manualReview++
        await adminClient
          .from('extratos_bancarios')
          .update({
            ai_reasoning: 'Sem correspondencia confiavel.',
            ai_processed_at: new Date().toISOString(),
          })
          .eq('id', extrato.id)
        continue
      }

      // Data integrity: never auto-reconcile if values differ >0.01%
      const vDiff =
        Math.abs(extrato.valor - bestMatch.candidate.amount) /
        Math.max(
          Math.abs(extrato.valor),
          Math.abs(bestMatch.candidate.amount),
          0.01,
        )
      let confidence = bestMatch.score
      if (vDiff > 0.0001 && confidence >= 0.9) confidence = 0.89

      const reconId = crypto.randomUUID()

      if (confidence >= 0.9) {
        autoReconciled++
        await adminClient
          .from('extratos_bancarios')
          .update({
            reconciled: true,
            ai_confidence: confidence,
            ai_reasoning: bestMatch.reasoning,
            ai_reconciliation_id: reconId,
            ai_processed_at: new Date().toISOString(),
          })
          .eq('id', extrato.id)
        await adminClient
          .from('critica')
          .update({
            reconciled: true,
            ai_confidence: confidence,
            ai_reasoning: bestMatch.reasoning,
            ai_reconciliation_id: reconId,
            ai_processed_at: new Date().toISOString(),
          })
          .eq('id', bestMatch.candidate.id)
        await adminClient.from('reconciliation_patterns').insert({
          description_pattern: extrato.descricao,
          user_id: user.id,
        })
      } else if (confidence >= 0.6) {
        suggested++
        await adminClient
          .from('extratos_bancarios')
          .update({
            ai_confidence: confidence,
            ai_reasoning: bestMatch.reasoning,
            ai_reconciliation_id: reconId,
            ai_processed_at: new Date().toISOString(),
          })
          .eq('id', extrato.id)
        await adminClient
          .from('critica')
          .update({
            ai_confidence: confidence,
            ai_reasoning: bestMatch.reasoning,
            ai_reconciliation_id: reconId,
          })
          .eq('id', bestMatch.candidate.id)
        suggestions.push({
          extrato_id: extrato.id,
          critica_id: bestMatch.candidate.id,
          confidence,
          reasoning: bestMatch.reasoning,
          extrato_descricao: extrato.descricao,
          extrato_valor: extrato.valor,
          extrato_data: extrato.data,
          critica_historico: bestMatch.candidate.historico,
          critica_amount: bestMatch.candidate.amount,
          critica_date: bestMatch.candidate.date,
        })
      } else {
        manualReview++
        await adminClient
          .from('extratos_bancarios')
          .update({
            ai_confidence: confidence,
            ai_reasoning: bestMatch.reasoning,
            ai_processed_at: new Date().toISOString(),
          })
          .eq('id', extrato.id)
      }
    }

    return new Response(
      JSON.stringify({
        status: 'completed',
        summary: {
          autoReconciled,
          suggested,
          manualReview,
          total: (extratos || []).length,
        },
        suggestions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error in ai-reconcile:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
