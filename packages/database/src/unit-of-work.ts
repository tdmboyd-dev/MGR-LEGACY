import type {
  CommandTransaction,
  UnitOfWorkPort
} from "@mgr/legacy-core";
import type { SqlDatabase, SqlTransaction } from "./sql.js";
import { PostgresAuditStore, PostgresOutbox } from "./audit-outbox.js";
import { PostgresEventLedger } from "./event-ledger-repository.js";
import { PostgresIdempotencyStore } from "./idempotency.js";

function ports(tx:SqlTransaction):CommandTransaction {
  return {
    idempotency:new PostgresIdempotencyStore(tx),
    audit:new PostgresAuditStore(tx),
    events:new PostgresEventLedger(tx),
    outbox:new PostgresOutbox(tx)
  };
}

export class PostgresUnitOfWork implements UnitOfWorkPort {
  constructor(private readonly db:SqlDatabase) {}

  async run<T>(fn:(tx:CommandTransaction)=>Promise<T>):Promise<T> {
    const transaction=await this.db.begin();
    try {
      const result=await fn(ports(transaction));
      await transaction.commit();
      return result;
    } catch(error) {
      await transaction.rollback();
      throw error;
    }
  }
}
