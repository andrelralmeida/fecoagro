import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'

const PAGE_W = 595.28
const PAGE_H = 841.89
const MARGIN = 40

function truncateText(text: string, maxWidth: number, font: any, size: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  let t = text
  while (t.length > 0 && font.widthOfTextAtSize(t + '...', size) > maxWidth) {
    t = t.slice(0, -1)
  }
  return t + '...'
}

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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { title, columns, rows } = await req.json()
    if (!title || !columns || !rows) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const tableWidth = PAGE_W - 2 * MARGIN
    const colWidth = tableWidth / columns.length
    const fontSize = 8
    const headerFontSize = 9
    const rowHeight = 18

    let page = pdfDoc.addPage([PAGE_W, PAGE_H])
    let y = PAGE_H - MARGIN

    page.drawText('Gestão Contábil - FECOAGRO', {
      x: MARGIN, y, size: 14, font: boldFont, color: rgb(0.1, 0.1, 0.35),
    })
    y -= 18
    page.drawText(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, {
      x: MARGIN, y, size: 8, font, color: rgb(0.4, 0.4, 0.4),
    })
    y -= 14
    page.drawText(title, {
      x: MARGIN, y, size: 12, font: boldFont, color: rgb(0.15, 0.15, 0.15),
    })
    y -= 10
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    y -= 20

    const drawHeaders = (p: any, py: number) => {
      columns.forEach((col: any, i: number) => {
        const text = truncateText(col.header, colWidth - 6, boldFont, headerFontSize)
        p.drawText(text, { x: MARGIN + i * colWidth + 3, y: py, size: headerFontSize, font: boldFont, color: rgb(0.2, 0.2, 0.2) })
      })
      p.drawLine({ start: { x: MARGIN, y: py - 4 }, end: { x: PAGE_W - MARGIN, y: py - 4 }, thickness: 0.5, color: rgb(0.6, 0.6, 0.6) })
      return py - rowHeight
    }

    y = drawHeaders(page, y)

    rows.forEach((row: any, rowIdx: number) => {
      if (y < MARGIN + 30) {
        page = pdfDoc.addPage([PAGE_W, PAGE_H])
        y = PAGE_H - MARGIN
        y = drawHeaders(page, y)
      }

      if (rowIdx % 2 === 1) {
        page.drawRectangle({
          x: MARGIN, y: y - 2, width: tableWidth, height: rowHeight - 2,
          color: rgb(0.96, 0.96, 0.97), borderWidth: 0,
        })
      }

      columns.forEach((col: any, i: number) => {
        const value = String(row[col.key] ?? '')
        const text = truncateText(value, colWidth - 6, font, fontSize)
        page.drawText(text, { x: MARGIN + i * colWidth + 3, y, size: fontSize, font, color: rgb(0.25, 0.25, 0.25) })
      })
      y -= rowHeight
    })

    const totalPages = pdfDoc.getPageCount()
    pdfDoc.getPages().forEach((p, i) => {
      p.drawText(`Página ${i + 1} de ${totalPages}`, {
        x: PAGE_W - MARGIN - 80, y: 20, size: 7, font, color: rgb(0.5, 0.5, 0.5),
      })
    })

    const pdfBytes = await pdfDoc.save()

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error in generate-pdf:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
