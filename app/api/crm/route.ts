import { env } from "cloudflare:workers";
import {staff,errorResponse} from '@/lib/crm-server';

const types = new Set(["client","lead","project","proposal","invoice","subscription","task","ticket","activity","onboarding","contract","update","folder","resource","template"]);
function database() { if (!env.DB) throw new Error("Database unavailable"); return env.DB; }
function decode(row: Record<string, unknown>) {
  return { id: row.id, type: row.type, name: row.name, clientId: row.client_id, status: row.status, value: row.value, payload: JSON.parse(String(row.payload)), createdAt: row.created_at, updatedAt: row.updated_at };
}
function fail(error: unknown) { console.error("CRM storage failure", error); return Response.json({error:"The workspace could not be saved or loaded. Please retry."},{status:500}); }
export async function GET() {
  try { await staff(); const result = await database().prepare("SELECT * FROM crm_records ORDER BY updated_at DESC").all(); return Response.json({records:result.results.map(decode)}); } catch(error) { return errorResponse(error); }
}
export async function POST(request: Request) {
  try {
    await staff(true);
    const body = await request.json() as Record<string, unknown>;
    if (body.action === "applyWorkflow") {
      const db=database();
      const project=await db.prepare("SELECT * FROM crm_records WHERE id=? AND type='project'").bind(String(body.projectId)).first();
      if(!project) return Response.json({error:"Select an existing project"},{status:400});
      const tasks=Array.isArray(body.tasks)?body.tasks:[];
      if(!tasks.length || tasks.length>40 || tasks.some(t=>typeof t!=="string" || !t.trim() || t.length>200)) return Response.json({error:"Add between 1 and 40 task titles"},{status:400});
      const now=new Date().toISOString();
      await db.batch(tasks.map((title,index)=>db.prepare("INSERT INTO crm_records (id,type,name,client_id,status,value,payload,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),"task",title,project.client_id,"open",0,JSON.stringify({projectId:project.id,owner:"Kunle",order:index,priority:"normal",workflow:body.name}),now,now)));
      return Response.json({ok:true},{status:201});
    }
    if (!types.has(String(body.type)) || typeof body.name !== "string" || !body.name.trim()) return Response.json({error:"A valid type and name are required"},{status:400});
    const value = Number(body.value ?? 0);
    if (!Number.isSafeInteger(value) || value < 0) return Response.json({error:"Amount must be non-negative whole pence"},{status:400});
    const id = crypto.randomUUID(), now = new Date().toISOString();
    await database().prepare("INSERT INTO crm_records (id,type,name,client_id,status,value,payload,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id,body.type,body.name.trim(),body.clientId ?? null,body.status ?? "active",value,JSON.stringify(body.payload ?? {}),now,now).run();
    const row = await database().prepare("SELECT * FROM crm_records WHERE id=?").bind(id).first();
    return Response.json({record:decode(row!)},{status:201});
  } catch(error) { return errorResponse(error); }
}
export async function PATCH(request: Request) {
  try {
    await staff(true);
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.id !== "string") return Response.json({error:"Record id required"},{status:400});
    const db = database(), row = await db.prepare("SELECT * FROM crm_records WHERE id=?").bind(body.id).first();
    if (!row) return Response.json({error:"Record not found"},{status:404});
    if(['accepted','signed'].includes(String(body.status)))return Response.json({error:'Use the client acceptance or signature flow'},{status:400});
    if(['member','audit'].includes(String(row.type))||(['proposal','contract'].includes(String(row.type))&&['signed','accepted'].includes(String(row.status))))return Response.json({error:'This record is protected; use the client journey actions'},{status:403});
    if(body.name !== undefined && (typeof body.name!=="string" || !body.name.trim())) return Response.json({error:"Name cannot be empty"},{status:400});
    const value = Number(body.value ?? row.value);
    if (!Number.isSafeInteger(value) || value < 0) return Response.json({error:"Invalid amount"},{status:400});
    const payload = {...JSON.parse(String(row.payload)), ...(body.payload as object ?? {})};
    await db.prepare("UPDATE crm_records SET name=?,status=?,value=?,payload=?,client_id=?,updated_at=? WHERE id=?").bind(body.name ?? row.name,body.status ?? row.status,value,JSON.stringify(payload),body.clientId === undefined ? row.client_id : body.clientId,new Date().toISOString(),body.id).run();
    return Response.json({record:decode((await db.prepare("SELECT * FROM crm_records WHERE id=?").bind(body.id).first())!)});
  } catch(error) { return errorResponse(error); }
}
