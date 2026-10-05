export interface SqlResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export interface SqlExecutor {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<SqlResult<T>>;
}

export interface SqlTransaction extends SqlExecutor {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface SqlDatabase extends SqlExecutor {
  begin(): Promise<SqlTransaction>;
}
