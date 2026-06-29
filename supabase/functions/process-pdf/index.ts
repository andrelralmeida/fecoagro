import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from '@supabase/supabase-js'
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
    fullText += content.items.map((item: any) => item.str).join(' ') + '\n'
  }
  return fullText
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

    const { filePath, entityType } = await req.json()
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

    switch (entityType) {
      case 'notas_fiscais':
        records = parseNotasFiscais(extractedText, user.id)
        break
      case 'razao':
        records = parseRazao(extractedText, user.id)
        break
      case 'bancos':
        records = parseBancos(extractedText, user.id)
        break
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
