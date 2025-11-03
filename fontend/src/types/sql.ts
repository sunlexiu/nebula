export interface SqlColumn { name: string; type?: string }
export interface SqlResult { columns: SqlColumn[]; rows: any[]; rowCount?: number; elapsedMs?: number }
export interface SqlError { message: string; code?: string | number }