import { AdeolaCRM } from "./crm-app";
import {actor} from '@/lib/crm-server';
import {ClientPortal,Journey} from './journey';

export const dynamic = "force-dynamic";

export default async function Home() {
  try{const user=await actor();return user.role==='client'?<ClientPortal/>:user.role==='contributor'?<main className="p-6"><Journey/></main>:<AdeolaCRM/>;}
  catch{return <main className="panel m-8"><h1>Adeola CRM</h1><p className="my-4">Sign in with your assigned account to access your workspace.</p><a href="/signin-with-chatgpt?return_to=/" target="_top">Sign in with ChatGPT</a></main>}
}
