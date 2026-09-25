import {DatabaseSync} from 'node:sqlite';
import vm from 'node:vm';
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const sql=new DatabaseSync(':memory:');
sql.exec(fs.readFileSync('drizzle/0000_omniscient_hedge_knight.sql','utf8'));
let identity={id:'owner',email:'adeolagroup@gmail.com'};
const db={prepare(query){return {bind(...args){const stmt=sql.prepare(query);return {async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){return stmt.run(...args)},_run(){return stmt.run(...args)}}},async all(){return {results:sql.prepare(query).all()}}}},async batch(statements){sql.exec('BEGIN');try{const results=statements.map(s=>s._run());sql.exec('COMMIT');return results}catch(e){sql.exec('ROLLBACK');throw e}}};
const context=vm.createContext({console,crypto,Response,Request,URL,TextEncoder,Date,Uint8Array});
const cache=new Map();
async function moduleFor(file){
 if(cache.has(file))return cache.get(file);
 let m;
 if(file==='cloudflare:workers')m=new vm.SyntheticModule(['env'],function(){this.setExport('env',{DB:db})},{context});
 else if(file==='next/headers')m=new vm.SyntheticModule(['headers'],function(){this.setExport('headers',async()=>new Headers(identity?{'oai-authenticated-user-id':identity.id,'oai-authenticated-user-email':identity.email}:{}))},{context});
 else if(file==='next/navigation')m=new vm.SyntheticModule(['redirect'],function(){this.setExport('redirect',()=>{throw Error('redirect')})},{context});
 else {const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;m=new vm.SourceTextModule(code,{context,identifier:file,initializeImportMeta(meta){meta.env={DEV:false}}});}
 cache.set(file,m);await m.link(async(spec,ref)=>moduleFor(spec.startsWith('@/')?path.resolve(spec.slice(2)+'.ts'):spec.startsWith('.')?path.resolve(path.dirname(ref.identifier),spec+'.ts'):spec));return m;
}
const mod=await moduleFor(path.resolve('app/api/journey/route.ts'));await mod.evaluate();
const old=await moduleFor(path.resolve('app/api/crm/route.ts'));await old.evaluate();
const api=mod.namespace;
async function post(body,status=200){const response=await api.POST(new Request('https://crm.test/api/journey',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));return data}
function seed(id,type,name,clientId=null,payload={}){sql.prepare('INSERT INTO crm_records(id,type,name,client_id,status,value,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').run(id,type,name,clientId,'active',0,JSON.stringify(payload),new Date().toISOString(),new Date().toISOString())}
function row(id){const r=sql.prepare('SELECT * FROM crm_records WHERE id=?').get(id);return {...r,payload:JSON.parse(r.payload)}}
seed('client-a','client','QA client A');seed('client-b','client','QA client B');
seed('member-a','member','Client A','client-a',{email:'a@example.test',role:'client'});seed('member-b','member','Client B','client-b',{email:'b@example.test',role:'client'});seed('member-c','member','Contributor',null,{email:'c@example.test',role:'contributor'});
const proposal=await post({action:'save',type:'proposal',name:'QA brand project',clientId:'client-a',payload:{lineItems:[{description:'Identity',quantity:1,rate:100000}],terms:'Test agreement only',scope:'QA scope'}});
identity={id:'a',email:'a@example.test'};let data=await (await api.GET(new Request('https://crm.test/api/journey'))).json();assert.equal(data.records.length,0,'Draft must not appear to client');
await post({action:'publish',id:proposal.id},404);
identity={id:'owner',email:'adeolagroup@gmail.com'};await post({action:'startProject',id:proposal.id});await post({action:'publish',id:proposal.id});
identity={id:'a',email:'a@example.test'};const accepted=await post({action:'acceptProposal',id:proposal.id});await post({action:'acceptProposal',id:proposal.id});assert.equal(sql.prepare("SELECT COUNT(*) n FROM crm_records WHERE type='project'").get().n,1,'Repeat acceptance must not duplicate project');
const contract=`contract-${proposal.id}`,project=accepted.projectId;
assert.equal(row(project).payload.visible,true,'Acceptance publishes a prepared project');assert.equal(row(`onboarding-${proposal.id}`).payload.visible,true,'Acceptance publishes prepared onboarding');
identity={id:'owner',email:'adeolagroup@gmail.com'};await post({action:'publish',id:contract});
identity={id:'b',email:'b@example.test'};await post({action:'sign',id:contract,consent:true,signedBy:'Wrong client'},404);data=await (await api.GET(new Request('https://crm.test/api/journey'))).json();assert.equal(data.records.length,0,'Other client must see nothing');
identity={id:'a',email:'a@example.test'};await post({action:'sign',id:contract,consent:false,signedBy:'QA client'},400);await post({action:'sign',id:contract,consent:true,signedBy:'QA client'});assert.equal(row(contract).status,'signed');assert.equal(row(contract).payload.documentHash.length,64);
await post({action:'sign',id:contract,consent:true,signedBy:'Again'},400);
assert.equal((await old.namespace.GET()).status,403,'Raw CRM endpoint must reject client');
identity={id:'owner',email:'adeolagroup@gmail.com'};await post({action:'save',id:contract,type:'contract',name:'Rewrite',clientId:'client-a',payload:{body:'Changed'}},400);
await post({action:'milestoneInvoices',id:project});await post({action:'milestoneInvoices',id:project});assert.equal(sql.prepare("SELECT COUNT(*) n FROM crm_records WHERE type='invoice'").get().n,2);assert.equal(row(`deposit-${project}`).value+row(`balance-${project}`).value,100000);
await post({action:'payment',id:`deposit-${project}`,paid:50001},400);await post({action:'payment',id:`deposit-${project}`,paid:50000});assert.equal(row(`deposit-${project}`).status,'paid');
const task=await post({action:'save',type:'task',name:'Assigned task',clientId:'client-a',payload:{projectId:project,owner:'c@example.test'}});
identity={id:'c',email:'c@example.test'};data=await (await api.GET(new Request('https://crm.test/api/journey'))).json();assert.equal(data.records.length,1);assert.equal(data.records[0].id,task.id);await post({action:'status',id:task.id,status:'complete'});await post({action:'payment',id:`deposit-${project}`,paid:0},403);assert.equal((await old.namespace.GET()).status,403);
identity=null;assert.equal((await api.GET(new Request('https://crm.test/api/journey'))).status,401);
console.log('PASS: client isolation, draft visibility, role restrictions, proposal conversion, duplicate prevention, signed-document locking, signature consent, deposit totals and payment limits.');
