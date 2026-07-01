export function getErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback

  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>
    const message = String(err.message || err.code || '')
    const hint = String(err.hint || '')

    if (
      message.includes('foreign key') ||
      message.includes('23503') ||
      message.includes('violates foreign key constraint')
    ) {
      return 'Registro relacionado não encontrado. Verifique as seleções.'
    }
    if (
      message.includes('duplicate') ||
      message.includes('23505') ||
      message.includes('unique constraint')
    ) {
      return 'Registro duplicado. Este item já existe.'
    }
    if (
      message.includes('not-null') ||
      message.includes('23502') ||
      message.includes('null value')
    ) {
      return 'Campo obrigatório não preenchido.'
    }
    if (
      message.includes('check') ||
      message.includes('23514') ||
      message.includes('check constraint')
    ) {
      return 'Valor inválido para o campo.'
    }
    if (
      message.includes('Conta sintética') ||
      message.includes('analytical account')
    ) {
      return message
    }
    if (message && message !== '[object Object]') return message
    if (hint) return hint
  }

  if (typeof error === 'string') return error
  return fallback
}
