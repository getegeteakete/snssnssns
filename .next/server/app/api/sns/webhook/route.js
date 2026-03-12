"use strict";(()=>{var e={};e.id=887,e.ids=[887],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},83069:(e,t,r)=>{let n,s;r.r(t),r.d(t,{originalPathname:()=>S,patchFetch:()=>N,requestAsyncStorage:()=>h,routeModule:()=>f,serverHooks:()=>x,staticGenerationAsyncStorage:()=>w});var o={};r.r(o),r.d(o,{GET:()=>m,PATCH:()=>y,POST:()=>_});var a=r(49303),i=r(88716),u=r(60670),l=r(87070),p=r(90275),c=r(90020);let d=require("node:crypto");function g(e=21){var t;t=e|=0,!n||n.length<t?(n=Buffer.allocUnsafe(128*t),d.webcrypto.getRandomValues(n),s=0):s+t>n.length&&(d.webcrypto.getRandomValues(n),s=0),s+=t;let r="";for(let t=s-e;t<s;t++)r+="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict"[63&n[t]];return r}async function _(e){let{platform:t,user_id:r,event_type:n,sender_id:s,sender_name:o,text:a,post_id:i,comment_id:u}=await e.json(),d=(0,p.i3)(),{data:_}=await d.from("keyword_triggers").select("*").eq("user_id",r).eq("platform",t).eq("is_active",!0),m=!1;if(_)for(let e of _){if(!e.trigger_type?.includes?.(n)&&e.trigger_type!==n)continue;let i=a.toLowerCase(),u=e.keywords.find(e=>i.includes(e.toLowerCase()));if(!u)continue;m=!0;let l=g(12),p=e.destination_url?`${e.destination_url}?ref=${l}&from=${s}`:null,c=e.reply_template;p&&(c=c.replace("{URL}",p).replace("{NAME}",o||"さん")),await d.from("trigger_logs").insert({trigger_id:e.id,user_id:r,platform:t,sender_id:s,sender_name:o,matched_keyword:u,reply_sent:c,issued_url:p,unique_token:l}),await d.from("keyword_triggers").update({triggered_count:(e.triggered_count||0)+1}).eq("id",e.id)}if(!m){let{data:e}=await d.from("ai_reply_settings").select("*").eq("user_id",r).single();if(e?.is_active){let n=await (0,c.sg)({originalText:a,senderName:o,brandTone:e.brand_tone||"丁寧でフレンドリー",platform:t}).catch(()=>null);if(n?.reply){let l="auto"===e.mode||"hybrid"===e.mode&&(e.auto_types||[]).includes(n.type);await d.from("ai_reply_queue").insert({user_id:r,platform:t,comment_id:u||g(),post_id:i,sender_id:s,sender_name:o,original_text:a,ai_reply:n.reply,reply_type:n.type,status:l?"auto_sent":"pending"})}}}return l.NextResponse.json({ok:!0})}async function m(e){let t=(0,p.fU)(),{data:{user:r}}=await t.auth.getUser();if(!r)return l.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:n}=new URL(e.url),s=n.get("status")||"pending",{data:o}=await t.from("ai_reply_queue").select("*").eq("user_id",r.id).eq("status",s).order("created_at",{ascending:!1}).limit(50);return l.NextResponse.json(o||[])}async function y(e){let t=(0,p.fU)(),{data:{user:r}}=await t.auth.getUser();if(!r)return l.NextResponse.json({error:"Unauthorized"},{status:401});let{id:n,status:s}=await e.json(),{error:o}=await t.from("ai_reply_queue").update({status:s,sent_at:new Date().toISOString()}).eq("id",n).eq("user_id",r.id);return o?l.NextResponse.json({error:o.message},{status:500}):l.NextResponse.json({ok:!0})}let f=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/sns/webhook/route",pathname:"/api/sns/webhook",filename:"route",bundlePath:"app/api/sns/webhook/route"},resolvedPagePath:"/home/claude/aimo-app/src/app/api/sns/webhook/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:h,staticGenerationAsyncStorage:w,serverHooks:x}=f,S="/api/sns/webhook/route";function N(){return(0,u.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:w})}},90020:(e,t,r)=>{r.d(t,{sg:()=>u,Fc:()=>l,Mz:()=>p,iE:()=>i});let n=require("@anthropic-ai/sdk"),s=new(r.n(n)())({apiKey:process.env.ANTHROPIC_API_KEY}),o={cmo:`あなたはAIMOのCMOエージェントです。集客戦略の専門家として、データに基づいた実践的な施策を提案します。
回答は必ず以下のJSON形式で返してください：
{ "title": "提案タイトル", "body": "詳細説明", "priority": "high|medium|low", "expected_impact": "期待効果", "category": "カテゴリ" }`,sns:`あなたはAIMOのSNS運用エージェントです。ターゲット・媒体・目的に最適化したSNS投稿文を生成します。
回答はJSONで返してください：
{ "content": "投稿文", "hashtags": ["#タグ1","#タグ2"], "best_time": "HH:MM", "platform_tip": "媒体別アドバイス" }`,lp:`あなたはAIMOのLP改善エージェントです。CVR改善に特化した提案を行います。
回答はJSONで返してください：
{ "title": "改善提案", "body": "詳細", "priority": "high|medium|low", "expected_cvr_lift": "CVR改善予測", "section": "改善箇所" }`,analytics:`あなたはAIMOのデータ分析エージェントです。分析データから洞察を見つけ、改善アクションを提案します。
回答はJSONで返してください：
{ "insight": "発見した洞察", "recommendation": "推奨アクション", "data_points": ["データポイント1"], "priority": "high|medium|low" }`,reply:`あなたはSNSの自動返答AIです。ブランドトーンを守りながら、自然な日本語でコメント・DMに返答します。
簡潔かつ親切に、ブランドらしさを保って回答してください。
回答はJSONで返してください：
{ "reply": "返答文", "tone": "friendly|professional|apologetic", "type": "general|complaint|inquiry|praise" }`};async function a(e,t,r){let n=[];r&&(n.push({role:"user",content:`コンテキスト情報:
${r}`}),n.push({role:"assistant",content:"コンテキストを理解しました。"})),n.push({role:"user",content:t});let a=await s.messages.create({model:"claude-sonnet-4-20250514",max_tokens:1024,system:o[e],messages:n}),i=a.content.find(e=>"text"===e.type)?.text||"{}";try{let e=i.replace(/```json\n?|```\n?/g,"").trim();return JSON.parse(e)}catch{return{raw:i}}}async function i(e){return a("sns",`
媒体: ${e.platform}
業種: ${e.businessType}
トピック: ${e.topic}
トーン: ${e.tone}
ターゲット: ${e.targetAudience}

上記の条件で、${e.platform}に最適化した投稿文を生成してください。
`)}async function u(e){return a("reply",`
プラットフォーム: ${e.platform}
ブランドトーン: ${e.brandTone}
送信者名: ${e.senderName}
受信メッセージ: "${e.originalText}"

上記のメッセージへの返答を生成してください。
`)}async function l(e){return a("sns",`
店舗名: ${e.businessName}
投稿タイプ: ${e.postType}
トピック/内容: ${e.topic}
${e.season?`季節: ${e.season}`:""}

Googleビジネスプロフィール向けの投稿文を生成してください。
240文字以内で、CTAを含め、来店・問い合わせを促す内容にしてください。
`)}async function p(e){return a(e.agentRole,`以下のデータを分析して改善提案を生成してください:
${e.analyticsData}`)}},90275:(e,t,r)=>{r.d(t,{i3:()=>i,fU:()=>a});var n=r(67721),s=r(37857),o=r(71615);function a(){let e=(0,o.cookies)();return(0,n.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://placeholder.supabase.co",process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"placeholder",{cookies:{get:t=>e.get(t)?.value,set(t,r,n){try{e.set({name:t,value:r,...n})}catch{}},remove(t,r){try{e.set({name:t,value:"",...r})}catch{}}}})}function i(){return(0,s.eI)(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://placeholder.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY||"placeholder",{auth:{autoRefreshToken:!1,persistSession:!1}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[948,355,972],()=>r(83069));module.exports=n})();