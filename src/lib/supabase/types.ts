// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      atividades: {
        Row: {
          atividade: string
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          atividade: string
          created_at?: string | null
          id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          atividade?: string
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bancos: {
        Row: {
          agencia: string
          banco: string
          conta_corrente: string
          created_at: string | null
          id: number
          saldo_atual: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agencia: string
          banco: string
          conta_corrente: string
          created_at?: string | null
          id: number
          saldo_atual?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agencia?: string
          banco?: string
          conta_corrente?: string
          created_at?: string | null
          id?: number
          saldo_atual?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      centro_custos: {
        Row: {
          centro_de_custos: string
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          centro_de_custos: string
          created_at?: string | null
          id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          centro_de_custos?: string
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      critica: {
        Row: {
          amount: number
          atividade_id: number | null
          category: string | null
          centro_custo_id: number | null
          created_at: string | null
          date: string
          description: string
          historico: string | null
          id: string
          lote: number | null
          nota_fiscal_id: number | null
          payment_method: string | null
          plano_conta_id: number | null
          reconciled: boolean
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          atividade_id?: number | null
          category?: string | null
          centro_custo_id?: number | null
          created_at?: string | null
          date: string
          description: string
          historico?: string | null
          id?: string
          lote?: number | null
          nota_fiscal_id?: number | null
          payment_method?: string | null
          plano_conta_id?: number | null
          reconciled?: boolean
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          atividade_id?: number | null
          category?: string | null
          centro_custo_id?: number | null
          created_at?: string | null
          date?: string
          description?: string
          historico?: string | null
          id?: string
          lote?: number | null
          nota_fiscal_id?: number | null
          payment_method?: string | null
          plano_conta_id?: number | null
          reconciled?: boolean
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "critica_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "critica_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centro_custos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "critica_nota_fiscal_id_fkey"
            columns: ["nota_fiscal_id"]
            isOneToOne: false
            referencedRelation: "notas_fiscais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "critica_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      extratos_bancarios: {
        Row: {
          banco_id: number
          created_at: string | null
          data: string
          descricao: string
          id: number
          tipo: string
          updated_at: string | null
          user_id: string
          valor: number
        }
        Insert: {
          banco_id: number
          created_at?: string | null
          data: string
          descricao: string
          id?: number
          tipo: string
          updated_at?: string | null
          user_id: string
          valor: number
        }
        Update: {
          banco_id?: number
          created_at?: string | null
          data?: string
          descricao?: string
          id?: number
          tipo?: string
          updated_at?: string | null
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "extratos_bancarios_banco_id_fkey"
            columns: ["banco_id"]
            isOneToOne: false
            referencedRelation: "bancos"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          created_at: string | null
          data_emissao: string
          emissor: string
          id: number
          numero_nota: string
          status: string
          updated_at: string | null
          user_id: string
          valor_total: number
        }
        Insert: {
          created_at?: string | null
          data_emissao: string
          emissor: string
          id?: number
          numero_nota: string
          status?: string
          updated_at?: string | null
          user_id: string
          valor_total?: number
        }
        Update: {
          created_at?: string | null
          data_emissao?: string
          emissor?: string
          id?: number
          numero_nota?: string
          status?: string
          updated_at?: string | null
          user_id?: string
          valor_total?: number
        }
        Relationships: []
      }
      plano_contas: {
        Row: {
          classificacao: string | null
          created_at: string | null
          descricao: string | null
          id: number
          tipo: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          classificacao?: string | null
          created_at?: string | null
          descricao?: string | null
          id: number
          tipo?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          classificacao?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: number
          tipo?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      razao: {
        Row: {
          conta: string
          created_at: string | null
          credito: number
          data: string
          debito: number
          descricao: string
          historico: string | null
          id: number
          lote: number | null
          plano_conta_id: number | null
          saldo: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conta: string
          created_at?: string | null
          credito?: number
          data: string
          debito?: number
          descricao: string
          historico?: string | null
          id?: number
          lote?: number | null
          plano_conta_id?: number | null
          saldo?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conta?: string
          created_at?: string | null
          credito?: number
          data?: string
          debito?: number
          descricao?: string
          historico?: string | null
          id?: number
          lote?: number | null
          plano_conta_id?: number | null
          saldo?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "razao_plano_conta_id_fkey"
            columns: ["plano_conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_dashboard_kpi: { Args: { p_date_now: string }; Returns: Json }
      get_latest_transaction_id: { Args: never; Returns: string }
      get_next_lote: { Args: never; Returns: number }
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

