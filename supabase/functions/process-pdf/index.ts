import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import {
  parsePlanoContas,
  parseRazao,
  parseNotasFiscais,
  parseBancos,
  parseCritica,
  parseCentroCustos,
  parseAtividades,
} from '../_shared/pdf-parsers.ts'

const FECOAGRO_LOGO =
  'https://www.fecoagro.coop.br/wp-content/uploads/2021/10/logo-top.png'

async function extractPdfText(data: Uint8Array): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''
  const loadingTask = pdfjsLib.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
  })
  const pdf = await loadingTask.promise
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    for (const item of content.items) {
      const ti = item as any
      fullText += ti.str
      fullText += ti.hasEOL ? '\n' : ' '
    }
    fullText += '\n'
  }
  return fullText
}

async function extractExtratosWithAI(
  text: string,
  userId: string,
  bancoId: number,
): Promise<any[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (apiKey) {
    try {
      const systemPrompt =
        'You are a financial data extraction expert. Extract bank statement entries from the text. Return a JSON array. Each item: {"data":"YYYY-MM-DD","descricao":"text","valor":number,"tipo":"credit" or "debit"}. Return only JSON, no markdown.'
      const userPrompt = text.substring(0, 12000)
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
          }),
        },
      )
      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ''
        const cleaned = content
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim()
        const parsed = JSON.parse(cleaned)
        if (Array.isArray(parsed)) {
          return parsed.map((r: any) => ({
            user_id: userId,
            banco_id: bancoId,
            data: r.data,
            descricao: String(r.descricao || '').substring(0, 500),
            valor: Number(r.valor) || 0,
            tipo: r.tipo === 'credit' ? 'credit' : 'debit',
          }))
        }
      }
    } catch (e) {
      console.error('AI extraction failed, falling back to regex:', e)
    }
  }
  const records: any[] = []
  const lines = text.split('\n')
  const dateRe = /(\d{2})\/(\d{2})\/(\d{4})/
  const valueRe = /-?[\d.]+,\d{2}/g
  for (const line of lines) {
    const dm = line.match(dateRe)
    if (!dm) continue
    const data = `${dm[3]}-${dm[2]}-${dm[1]}`
    const nums = [...line.matchAll(valueRe)]
    if (nums.length === 0) continue
    const valorStr = nums[nums.length - 1][0]
    const valor = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'))
    const descricao = line.replace(dateRe, '').replace(valueRe, '').trim().substring(0, 500)
    if (!descricao || valor === 0) continue
    records.push({
      user_id: userId,
      banco_id: bancoId,
      data,
      descricao,
      valor: Math.abs(valor),
      tipo: valor < 0 ? 'debit' : 'credit',
    })
  }
  return records
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
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

    const { filePath, entityType, bancoId } = await req.json()
    if (!filePath || !entityType) {
      return new Response(
        JSON.stringify({ error: 'filePath and entityType are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { data: fileData, error: downloadError } =
      await supabaseClient.storage.from('imports').download(filePath)
    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const pdfBytes = new Uint8Array(await fileData.arrayBuffer())
    let extractedText = ''
    try {
      extractedText = await extractPdfText(pdfBytes)
    } catch (parseError) {
      console.error('PDF parse error:', parseError)
      return new Response(
        JSON.stringify({ error: 'Failed to parse PDF.', logo: FECOAGRO_LOGO }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let records: any[] = []
    let tableName = entityType
    let importSummary:
      | { totalDebits: number; totalCredits: number; recordCount: number }
      | undefined

    switch (entityType) {
      case 'notas_fiscais':
        records = parseNotasFiscais(extractedText, user.id)
        break
      case 'razao': {
        const parsedRazao = parseRazao(extractedText, user.id)
        const [filiaisRes, atividadesRes, ccRes, pcRes] = await Promise.all([
          adminClient.from('filiais').select('id').eq('user_id', user.id),
          adminClient.from('atividades').select('id').eq('user_id', user.id),
          adminClient.from('centro_custos').select('id').eq('user_id', user.id),
          adminClient.from('plano_contas').select('id').eq('user_id', user.id),
        ])
        const vFil = new Set((filiaisRes.data || []).map((r: any) => r.id))
        const vAti = new Set((atividadesRes.data || []).map((r: any) => r.id))
        const vCC = new Set((ccRes.data || []).map((r: any) => r.id))
        const vPC = new Set((pcRes.data || []).map((r: any) => r.id))
        records = parsedRazao.map((r: any) => ({
          ...r,
          filial_id: r.filial_id && vFil.has(r.filial_id) ? r.filial_id : null,
          atividade_id:
            r.atividade_id && vAti.has(r.atividade_id) ? r.atividade_id : null,
          centro_custo_id:
            r.centro_custo_id && vCC.has(r.centro_custo_id)
              ? r.centro_custo_id
              : null,
          plano_conta_id:
            r.plano_conta_id && vPC.has(r.plano_conta_id)
              ? r.plano_conta_id
              : null,
        }))
        importSummary = {
          totalDebits: records.reduce(
            (sum: number, r: any) => sum + (r.debito || 0),
            0,
          ),
          totalCredits: records.reduce(
            (sum: number, r: any) => sum + (r.credito || 0),
            0,
          ),
          recordCount: records.length,
        }
        break
      }
      case 'bancos':
        records = parseBancos(extractedText, user.id)
        break
      case 'extratos_bancarios': {
        if (!bancoId) {
          return new Response(
            JSON.stringify({ error: 'bancoId is required for extratos_bancarios import' }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            },
          )
        }
        records = await extractExtratosWithAI(extractedText, user.id, bancoId)
        break
      }
      case 'critica':
      case 'transactions':
        records = parseCritica(extractedText, user.id)
        tableName = 'critica'
        break
      case 'centro_custos':
        records = parseCentroCustos(extractedText, user.id)
        break
      case 'atividades':
        records = parseAtividades(extractedText, user.id)
        break
      case 'plano_contas': {
        const { data: existingDb } = await adminClient
          .from('plano_contas')
          .select('id, classificacao')
          .eq('user_id', user.id)
        const existingIds = new Set(existingDb?.map((r: any) => r.id) || [])
        const existingClass = new Set(
          existingDb?.map((r: any) => r.classificacao) || [],
        )
        let maxSyntheticId = 9000000
        if (existingDb) {
          for (const r of existingDb) {
            if (r.id >= 9000000)
              maxSyntheticId = Math.max(maxSyntheticId, r.id + 1)
          }
        }
        const parsedRecords = parsePlanoContas(
          extractedText,
          user.id,
          maxSyntheticId,
        )
        records = parsedRecords.filter(
          (r: any) =>
            !existingIds.has(r.id) && !existingClass.has(r.classificacao),
        )
        break
      }
      default:
        return new Response(JSON.stringify({ error: 'Unknown entity type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    if (records.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No records could be extracted from the PDF.',
          extractedTextLength: extractedText.length,
          recordsInserted: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let insertedCount = 0
    const chunkSize = 500
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize)
      const { data: inserted, error: insertError } = await adminClient
        .from(tableName)
        .insert(chunk)
        .select()
      if (insertError) {
        console.error('Insert error:', insertError)
        console.error('Failed chunk context:', {
          entityType,
          tableName,
          chunkIndex: i,
          chunkSize: chunk.length,
          firstRecordPlanoConta: chunk[0]?.plano_conta_id,
          firstRecordConta: chunk[0]?.conta,
        })
        return new Response(
          JSON.stringify({
            error: 'Failed to insert records',
            detail: insertError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }
      insertedCount += inserted?.length || 0
    }

    return new Response(
      JSON.stringify({
        message: 'PDF processed successfully',
        recordsInserted: insertedCount,
        entityType,
        ...(importSummary ? { summary: importSummary } : {}),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error in process-pdf:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
