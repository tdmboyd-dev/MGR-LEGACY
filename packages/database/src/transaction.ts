import type {SqlDatabase,SqlTransaction} from './sql.js';

export async function inTransaction<T>(db:SqlDatabase,run:(tx:SqlTransaction)=>Promise<T>):Promise<T>{
 const tx=await db.begin();
 try{const result=await run(tx);await tx.commit();return result;}
 catch(error){await tx.rollback();throw error;}
}
