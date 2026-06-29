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
  const contaPattern = /(\d{1,2}\.\d{1,2}\.\d{1,2}\.\d{1,3})/g
  const contas = [...text.matchAll(contaPattern)]
  for (let i = 0; i < Math.min(contas.length, 20); i++) {
    const valorStr =
      (contas[i].input || '')
        .substring(contas[i].index)
        .match(/[\d.,]+/)?.[0]
        ?.replace(/\./g, '')
        .replace(',', '.') || '0'
    const valor = parseFloat(valorStr)
    records.push({
      user_id: userId,
      data: new Date().toISOString().split('T')[0],
      conta: contas[i][1],
      historico: 'Importado via PDF',
      debito: valor > 0 ? valor : 0,
      credito: 0,
      saldo: valor,
    })
  }
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
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length >= 3)
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    records.push({
      user_id: userId,
      centro_de_custos: lines[i].substring(0, 100),
    })
  }
  return records
}

export function parseAtividades(text: string, userId: string): any[] {
  const records: any[] = []
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length >= 3)
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    records.push({ user_id: userId, atividade: lines[i].substring(0, 100) })
  }
  return records
}
