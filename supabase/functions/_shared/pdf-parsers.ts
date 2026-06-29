export function parsePlanoContas(
  text: string,
  userId: string,
  startSyntheticId = 9000000,
): any[] {
  const records: any[] = []
  const lines = text.split('\n')
  let syntheticIdCounter = startSyntheticId
  const seenIds = new Set<number>()
  const seenClass = new Set<string>()

  const skipPatterns = [
    /federac[ãa]o\s+cooper/i,
    /plano\s+de\s+contas/i,
    /conta\s+reduzido\s+descri/i,
    /^[-=_\s]+$/,
    /^p[aá]gina\s+\d+/i,
    /^\d+\s*$/,
    /cnpj/i,
    /^\s*\/\s*$/,
    /data\s+emiss/i,
  ]

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.length < 3) continue
    if (skipPatterns.some((p) => p.test(trimmed))) continue

    const match = trimmed.match(
      /^(\d+(?:\.\d+)*)\s+(?:[DCdc]\s+)?(?:(\d{1,8})\s+(?=[A-Za-zÀ-ÿ]))?(.+)$/,
    )
    if (!match) continue

    const classificacao = match[1]
    const reduzido = match[2]
    let descricao = match[3].trim()
    descricao = descricao.replace(/^[DCdc]\s+/, '').trim()
    descricao = descricao.replace(/\s+\d{1,5}\s+\d{1,5}\s*$/, '').trim()
    descricao = descricao.replace(/\s{2,}/g, ' ').trim()
    if (!descricao || descricao.length < 2) continue

    let id: number
    if (reduzido) {
      id = parseInt(reduzido, 10)
      if (id >= syntheticIdCounter) syntheticIdCounter = id + 1
    } else {
      id = syntheticIdCounter++
    }

    if (seenIds.has(id) || seenClass.has(classificacao)) continue
    seenIds.add(id)
    seenClass.add(classificacao)

    records.push({
      id,
      user_id: userId,
      classificacao,
      descricao: descricao.substring(0, 255),
      tipo: reduzido ? 'analitica' : 'sintetica',
    })
  }
  return records
}

export function parseRazao(text: string, userId: string): any[] {
  const records: any[] = []
  const lines = text.split('\n')

  let planoContaId: number | null = null
  let contaClassificacao = ''

  const skipPatterns = [
    /federac[ãa]o\s+cooper/i,
    /razao\s+cont/i,
    /p[aá]gina\s+\d+/i,
    /^[-=_\s]+$/,
    /cnpj/i,
    /^data\b.*vlr\s*debit/i,
    /^data\s+fl\s+ati\s+cc/i,
    /^data\s+lote\s+seq/i,
    /^lote\s+seq\s+fl\s+ati/i,
  ]

  function convertDate(s: string): string | null {
    const m = s.match(/(\d{2})\/(\d{2})\/(\d{2,4})/)
    if (!m) return null
    let y = m[3]
    if (y.length === 2) y = '20' + y
    return `${y}-${m[2]}-${m[1]}`
  }

  function parseBr(s: string): number {
    if (!s) return 0
    let neg = false
    let c = s.trim()
    if (c.startsWith('-')) {
      neg = true
      c = c.substring(1)
    }
    const v = parseFloat(c.replace(/\./g, '').replace(',', '.')) || 0
    return neg ? -v : v
  }

  function nullIfZero(n: number | null | undefined): number | null {
    if (!n || n === 0) return null
    return n
  }

  for (const line of lines) {
    const cm = line.match(/CONTA\.?\s*:?\s*(\d{3,8})\s*\/\s*([\d.]+)/i)
    if (cm && /sintetica/i.test(line)) {
      planoContaId = parseInt(cm[1], 10)
      contaClassificacao = cm[2]
      break
    }
    const sm = line.match(/(\d{3,6})\s*[-\s].*SINTETICA/i)
    if (sm) {
      planoContaId = parseInt(sm[1], 10)
      contaClassificacao = sm[1]
      break
    }
    const cm2 = line.match(/conta[:\s]+(\d{3,6})/i)
    if (cm2) {
      planoContaId = parseInt(cm2[1], 10)
      contaClassificacao = cm2[1]
      break
    }
  }

  const dateRe = /(\d{2}\/\d{2}\/\d{2,4})/
  const brNumRe = /-?[\d.]+,\d{2}/g
  let pendingHist = ''
  let pending: any = null

  function flush() {
    if (pending) {
      const h = (pending.historico + ' ' + pendingHist)
        .trim()
        .replace(/\s+/g, ' ')
      pending.historico = h
      records.push(pending)
      pending = null
      pendingHist = ''
    }
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      if (pending) pendingHist += ' '
      continue
    }
    if (skipPatterns.some((p) => p.test(t))) continue

    if (/saldo\s+inicial/i.test(t)) {
      flush()
      const dm = t.match(dateRe)
      const date = dm
        ? convertDate(dm[1])
        : new Date().toISOString().split('T')[0]
      const nums = [...t.matchAll(brNumRe)]
      let saldo = 0
      if (nums.length >= 1) {
        saldo = parseBr(nums[nums.length - 1][0])
      }
      pending = {
        user_id: userId,
        data: date,
        conta: contaClassificacao || String(planoContaId || ''),
        historico: 'SALDO INICIAL',
        debito: 0,
        credito: 0,
        saldo,
        plano_conta_id: planoContaId,
        lote: null,
        filial_id: null,
        atividade_id: null,
        centro_custo_id: null,
      }
      flush()
      continue
    }

    const dm = t.match(dateRe)

    if (dm) {
      flush()
      const date = convertDate(dm[1])
      if (!date) continue

      let rest = t.substring(t.indexOf(dm[1]) + dm[1].length).trim()

      let lote: number | null = null
      let fl: number | null = null
      let ati: number | null = null
      let cc: number | null = null

      const m5 = rest.match(
        /^(\d{1,6})\s+(\d{1,6})\s+(\d{1,6})\s+(\d{1,6})\s+(\d{1,6})\s+(?=[A-Za-zÀ-ÿ])/,
      )
      const m4 = rest.match(
        /^(\d{1,6})\s+(\d{1,6})\s+(\d{1,6})\s+(\d{1,6})\s+(?=[A-Za-zÀ-ÿ])/,
      )
      const m3 = rest.match(
        /^(\d{1,6})\s+(\d{1,6})\s+(\d{1,6})\s+(?=[A-Za-zÀ-ÿ])/,
      )
      const m2 = rest.match(/^(\d{1,6})\s+(\d{1,6})\s+(?=[A-Za-zÀ-ÿ])/)
      const m1 = rest.match(/^(\d{1,6})\s+(?=[A-Za-zÀ-ÿ])/)

      if (m5) {
        lote = parseInt(m5[1], 10)
        fl = parseInt(m5[3], 10)
        ati = parseInt(m5[4], 10)
        cc = parseInt(m5[5], 10)
        rest = rest.substring(m5[0].length).trim()
      } else if (m4) {
        lote = parseInt(m4[1], 10)
        fl = parseInt(m4[2], 10)
        ati = parseInt(m4[3], 10)
        cc = parseInt(m4[4], 10)
        rest = rest.substring(m4[0].length).trim()
      } else if (m3) {
        fl = parseInt(m3[1], 10)
        ati = parseInt(m3[2], 10)
        cc = parseInt(m3[3], 10)
        rest = rest.substring(m3[0].length).trim()
      } else if (m2) {
        fl = parseInt(m2[1], 10)
        ati = parseInt(m2[2], 10)
        rest = rest.substring(m2[0].length).trim()
      } else if (m1) {
        fl = parseInt(m1[1], 10)
        rest = rest.substring(m1[0].length).trim()
      }

      const nums = [...rest.matchAll(brNumRe)]
      let hist = rest
      let debito = 0
      let credito = 0
      let saldo = 0

      if (nums.length >= 3) {
        const li = nums.length - 1
        saldo = parseBr(nums[li][0])
        credito = parseBr(nums[li - 1][0])
        debito = parseBr(nums[li - 2][0])
        hist = rest.substring(0, nums[li - 2].index).trim()
      } else if (nums.length === 2) {
        saldo = parseBr(nums[1][0])
        const first = parseBr(nums[0][0])
        if (/debit/i.test(hist)) debito = first
        else credito = first
        hist = rest.substring(0, nums[0].index).trim()
      } else if (nums.length === 1) {
        saldo = parseBr(nums[0][0])
        hist = rest.substring(0, nums[0].index).trim()
      }

      pending = {
        user_id: userId,
        data: date,
        conta: contaClassificacao || String(planoContaId || ''),
        historico: hist,
        debito,
        credito,
        saldo,
        plano_conta_id: planoContaId,
        lote,
        filial_id: nullIfZero(fl),
        atividade_id: nullIfZero(ati),
        centro_custo_id: nullIfZero(cc),
      }
      pendingHist = ''
    } else if (pending) {
      const nums = [...t.matchAll(brNumRe)]
      if (nums.length >= 3 && !t.match(dateRe)) {
        const li = nums.length - 1
        pending.saldo = parseBr(nums[li][0])
        pending.credito = parseBr(nums[li - 1][0])
        pending.debito = parseBr(nums[li - 2][0])
        pendingHist += ' ' + t.substring(0, nums[li - 2].index).trim()
        flush()
      } else {
        pendingHist += ' ' + t
      }
    }
  }
  flush()
  return records
}

export function parseNotasFiscais(text: string, userId: string): any[] {
  const records: any[] = []
  const notaPattern = /(?:nota\s*fiscal|nf-?e|n[uú]mero)[:\s]*(\d{3,})/gi
  const datePattern = /(\d{2})\/(\d{2})\/(\d{4})/g
  const valuePattern = /r\$\s*([\d.,]+)/gi
  const numeros: string[] = []
  let match
  while ((match = notaPattern.exec(text)) !== null) numeros.push(match[1])
  const datas = [...text.matchAll(datePattern)]
  const valores = [...text.matchAll(valuePattern)]
  const maxLen = Math.max(numeros.length, datas.length, valores.length)
  for (let i = 0; i < Math.min(maxLen, 20); i++) {
    records.push({
      user_id: userId,
      numero_nota: numeros[i] ? parseInt(numeros[i], 10) : Date.now() + i,
      data_emissao: datas[i]
        ? `${datas[i][3]}-${datas[i][2]}-${datas[i][1]}`
        : new Date().toISOString().split('T')[0],
      fornecedor: 'Importado via PDF',
      valor_total: valores[i]
        ? parseFloat(valores[i][1].replace(/\./g, '').replace(',', '.'))
        : 0,
      status: 'pendente',
    })
  }
  return records
}

export function parseBancos(text: string, userId: string): any[] {
  const records: any[] = []
  const bancoPattern = /(?:banco|ag[eê]ncia|conta)[:\s]*([a-z\s\d-]+)/gi
  const valuePattern = /r\$\s*([\d.,]+)/gi
  const valores = [...text.matchAll(valuePattern)]
  const nomes = [...text.matchAll(bancoPattern)]
  const maxLen = Math.max(valores.length, nomes.length)
  for (let i = 0; i < Math.min(maxLen, 10); i++) {
    records.push({
      user_id: userId,
      banco: nomes[i] ? nomes[i][1].trim().substring(0, 50) : `Banco ${i + 1}`,
      agencia: '0001',
      conta_corrente: `${10000 + i}`,
      saldo_atual: valores[i]
        ? parseFloat(valores[i][1].replace(/\./g, '').replace(',', '.'))
        : 0,
    })
  }
  return records
}

export function parseCritica(text: string, userId: string): any[] {
  const records: any[] = []
  const valuePattern = /r\$\s*([\d.,]+)/gi
  const valores = [...text.matchAll(valuePattern)]
  for (let i = 0; i < Math.min(valores.length, 20); i++) {
    records.push({
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      historico: `Importado via PDF - Item ${i + 1}`,
      amount: parseFloat(valores[i][1].replace(/\./g, '').replace(',', '.')),
      status: 'pendente',
    })
  }
  return records
}

export function parseCentroCustos(text: string, userId: string): any[] {
  const records: any[] = []
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length >= 3)
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    records.push({ user_id: userId, centro_de_custos: lines[i].substring(0, 100) })
  }
  return records
}

export function parseAtividades(text: string, userId: string): any[] {
  const records: any[] = []
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length >= 3)
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    records.push({ user_id: userId, atividade: lines[i].substring(0, 100) })
  }
  return records
}
