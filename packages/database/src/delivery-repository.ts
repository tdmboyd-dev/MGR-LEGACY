import type { DeliveryEvent } from "@mgr/legacy-communications";
import type { SqlExecutor } from "./sql.js";

export class PostgresDeliveryEventRepository {
  constructor(private readonly db:SqlExecutor){}

  async append(event:DeliveryEvent):Promise<void>{
    await this.db.query(
      `INSERT INTO delivery_events
       (tenant_id,provider_key,channel,message_id,event,at,details)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
      [event.tenantId,event.providerKey,event.channel,event.messageId,event.event,event.at,JSON.stringify(event.details)]
    );
  }

  async listForMessage(messageId:string):Promise<DeliveryEvent[]>{
    const result=await this.db.query<any>(
      "SELECT * FROM delivery_events WHERE message_id=$1 ORDER BY at,id",
      [messageId]
    );
    return result.rows.map(row=>({
      tenantId:row.tenant_id,providerKey:row.provider_key,channel:row.channel,messageId:row.message_id,
      event:row.event,at:new Date(row.at).toISOString(),details:row.details ?? {}
    }));
  }
}
