import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export type RecordRow={id:string;type:string;name:string;clientId:string|null;status:string;value:number;payload:Record<string,any>;createdAt:string;updatedAt:string};
export type Actor={id:string;email:string;name:string;role:'owner'|'manager'|'contributor'|'client';clientId:string|null};
export class AppError extends Error{constructor(message:string,public status=400){super(message)}}
export function db(){if(!env.DB)throw new AppError('Storage is temporarily unavailable',503);return env.DB;}
export function decode(row:any):RecordRow{return {id:row.id,type:row.type,name:row.name,clientId:row.client_id,status:row.status,value:row.value,payload:JSON.parse(row.payload||'{}'),createdAt:row.created_at,updatedAt:row.updated_at}}
export async function getRecord(id:string){const r=await db().prepare('SELECT * FROM crm_records WHERE id=?').bind(id).first();if(!r)throw new AppError('Record not found',404);return decode(r)}
export async function allRecords(){return (await db().prepare('SELECT * FROM crm_records ORDER BY updated_at DESC').all()).results.map(decode)}
export async function actor():Promise<Actor>{
 const user=await getChatGPTUser();
 if(!user){if(import.meta.env.DEV)return {id:'local-preview',email:'preview@local.test',name:'Preview administrator',role:'owner',clientId:null};throw new AppError('Please sign in',401)}
 if(user.email.toLowerCase()==='adeolagroup@gmail.com')return {id:user.userId,email:user.email,name:user.displayName,role:'owner',clientId:null};
 const row=await db().prepare("SELECT * FROM crm_records WHERE type='member' AND status='active' AND lower(json_extract(payload,'$.email'))=?").bind(user.email.toLowerCase()).first();
 if(!row)throw new AppError('Your account has not been assigned access to this CRM',403);
 const p=decode(row);if(p.payload.userId&&p.payload.userId!==user.userId)throw new AppError('Account identity mismatch',403);
 const role=p.payload.role;if(!['manager','contributor','client'].includes(role))throw new AppError('Invalid access role',403);
 return {id:user.userId,email:user.email,name:p.name,role,clientId:p.clientId};
}
export async function staff(write=false){const a=await actor();if(!['owner','manager'].includes(a.role))throw new AppError('This action requires a manager',403);return a}
export function insert(r:Partial<RecordRow>&{id:string;type:string;name:string}){const now=new Date().toISOString();return db().prepare('INSERT OR IGNORE INTO crm_records (id,type,name,client_id,status,value,payload,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(r.id,r.type,r.name,r.clientId||null,r.status||'draft',r.value||0,JSON.stringify(r.payload||{}),now,now)}
export function change(r:RecordRow,changes:Partial<RecordRow>){return db().prepare('UPDATE crm_records SET name=?,status=?,value=?,client_id=?,payload=?,updated_at=? WHERE id=?').bind(changes.name??r.name,changes.status??r.status,changes.value??r.value,changes.clientId===undefined?r.clientId:changes.clientId,JSON.stringify({...r.payload,...changes.payload}),new Date().toISOString(),r.id)}
export function audit(a:Actor,name:string,target:string,clientId:string|null=null){return insert({id:crypto.randomUUID(),type:'audit',name,status:'recorded',clientId,payload:{actor:a.name,email:a.email,target,at:new Date().toISOString()}})}
export function errorResponse(e:unknown){if(e instanceof AppError)return Response.json({error:e.message},{status:e.status});console.error(e);return Response.json({error:'The operation could not be completed. Your input has been retained.'},{status:500})}
export function text(value:unknown,max=20000){return typeof value==='string'?value.trim().slice(0,max):''}
export function amount(value:unknown){const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw new AppError('Amounts must be non-negative whole pence');return n}
export function visible(r:RecordRow,clientId:string){return r.clientId===clientId&&r.status!=='archived'&&r.payload.visible===true&&['project','proposal','contract','invoice','onboarding','deliverable','update','message','ticket','change','hub','resource','milestone'].includes(r.type)}
export function clientRecord(r:RecordRow){const allowed=['projectId','description','scope','exclusions','terms','due','dueDate','issueDate','lineItems','subtotal','discountPence','taxPence','paid','progress','questions','answers','body','version','signedBy','signedAt','documentHash','publishedBody','url','size','nextMilestone','paymentLink','paymentInstructions','author','clientDecision','reason','amount','receipt','publishedAt','brandColours','fonts','usage','visible'];return {...r,payload:Object.fromEntries(Object.entries(r.payload).filter(([k])=>allowed.includes(k)))} }
