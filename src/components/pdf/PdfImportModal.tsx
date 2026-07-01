import { useState, useRef } from 'react'
import { FileUp, Loader2, Upload, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { getErrorMessage } from '@/lib/error-utils'
import {
  uploadPdf,
  processPdf,
  type EntityType,
} from '@/services/pdfImportService'

interface PdfImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityType: EntityType
  onSuccess: () => void
  bancoId?: number
}

export function PdfImportModal({
  open,
  onOpenChange,
  entityType,
  onSuccess,
  bancoId,
}: PdfImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected && selected.type === 'application/pdf') {
      setFile(selected)
    } else {
      toast.error('Selecione um arquivo PDF válido')
    }
  }

  const handleUpload = async () => {
    if (!file) return
    try {
      setLoading(true)
      toast.info('Enviando arquivo...')
      const { path } = await uploadPdf(file, entityType)
      toast.info('Processando PDF...')
      const result = await processPdf(path, entityType, bancoId)
      toast.success(
        `${result.recordsInserted} registro(s) importado(s) com sucesso!`,
      )
      setFile(null)
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('PDF import error:', error)
      toast.error(
        getErrorMessage(
          error,
          'Erro ao processar PDF. Verifique o arquivo e tente novamente.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  const entityLabels: Record<EntityType, string> = {
    critica: 'Críticas Contábeis',
    notas_fiscais: 'Notas Fiscais',
    razao: 'Razão',
    bancos: 'Bancos',
    centro_custos: 'Centro de Custos',
    atividades: 'Atividades',
    plano_contas: 'Plano de Contas',
    extratos_bancarios: 'Extratos Bancários',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5 text-primary" />
            Importar PDF — {entityLabels[entityType]}
          </DialogTitle>
          <DialogDescription>
            Selecione um arquivo PDF para extrair e importar dados
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
          >
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-gray-400" />
                <p className="text-sm font-medium text-gray-600">
                  Clique para selecionar um arquivo
                </p>
                <p className="text-xs text-gray-400">Formato: PDF</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>
              O sistema irá extrair os dados do PDF e preencher automaticamente
              os registros.
            </span>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <FileUp className="w-4 h-4 mr-2" />
                Importar Dados
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
