import { env } from "cloudflare:workers";
import {actor,visible,getRecord,errorResponse} from '@/lib/crm-server';
export async function POST(request:Request){
 try {
  const a=await actor();
  if(a.role==='contributor')return Response.json({error:'File management requires a manager'},{status:403});
  if(!env.DB || !env.BUCKET) return Response.json({error:"File storage is unavailable"},{status:503});
  const form=await request.formData(),file=form.get("file");
  const clientId=a.role==='client'?a.clientId:String(form.get('clientId')||'')||null;
  const projectId=String(form.get('projectId')||'');
  if(a.role==='client'&&!clientId)return Response.json({error:'Client account not linked'},{status:403});
  if(projectId){const project=await getRecord(projectId);if(project.type!=='project'||(a.role==='client'&&project.clientId!==clientId))return Response.json({error:'Project unavailable'},{status:404});}
  if(!(file instanceof File) || !file.size || file.size>20*1024*1024) return Response.json({error:"Choose a file up to 20 MB"},{status:400});
  const id=crypto.randomUUID(),now=new Date().toISOString(),key=`resources/${id}`;
  await env.BUCKET.put(key,await file.arrayBuffer(),{httpMetadata:{contentType:"application/octet-stream"}});
  try {await env.DB.prepare("INSERT INTO crm_records (id,type,name,client_id,status,value,payload,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id,"resource",file.name,clientId,"active",0,JSON.stringify({folderId:a.role==='client'?'':String(form.get("folderId")||""),projectId,key,size:file.size,visible:a.role==='client',author:a.name}),now,now).run();}
  catch(error){await env.BUCKET.delete(key);throw error;}
  return Response.json({id},{status:201});
 } catch(error){return errorResponse(error);}
}
export async function GET(request:Request){
 try{
  const a=await actor();
  if(a.role==='contributor')return new Response('Access denied',{status:403});
  if(!env.DB || !env.BUCKET) return new Response("File storage unavailable",{status:503});
  const id=new URL(request.url).searchParams.get("id");
  if(a.role==='client'&&(!id||!a.clientId||!visible(await getRecord(id),a.clientId)))return new Response('Not found',{status:404});
  const row=await env.DB.prepare("SELECT * FROM crm_records WHERE id=? AND type='resource'").bind(id).first();
  if(!row)return new Response("Not found",{status:404});
  const payload=JSON.parse(String(row.payload));
  if(!payload.key)return new Response("Not found",{status:404});
  const file=await env.BUCKET.get(payload.key);if(!file)return new Response("Not found",{status:404});
  return new Response(file.body,{headers:{"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename*=UTF-8''${encodeURIComponent(String(row.name))}`,"X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store"}});
 }catch(error){return errorResponse(error);}
}
