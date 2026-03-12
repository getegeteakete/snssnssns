"use strict";(()=>{var e={};e.id=529,e.ids=[529],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},34521:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>_,requestAsyncStorage:()=>g,routeModule:()=>d,serverHooks:()=>h,staticGenerationAsyncStorage:()=>m});var n={};r.r(n),r.d(n,{POST:()=>l});var s=r(49303),a=r(88716),o=r(60670),i=r(87070),p=r(90275),c=r(90020);let u={generate_post:5,generate_reply:2,generate_gmb:5,generate_proposal:3};async function l(e){let t=(0,p.fU)(),{data:{user:r}}=await t.auth.getUser();if(!r)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{action:n,params:s}=await e.json(),a=u[n]||5,{data:o}=await t.from("profiles").select("points, plan").eq("id",r.id).single();if(!o||o.points<a)return i.NextResponse.json({error:"ポイントが不足しています",code:"insufficient_points"},{status:402});try{let e;switch(n){case"generate_post":e=await (0,c.iE)(s);break;case"generate_reply":e=await (0,c.sg)(s);break;case"generate_gmb":e=await (0,c.Fc)(s);break;case"generate_proposal":e=await (0,c.Mz)(s);break;default:return i.NextResponse.json({error:"Unknown action"},{status:400})}let p=o.points-a;return await t.from("profiles").update({points:p}).eq("id",r.id),await t.from("point_transactions").insert({user_id:r.id,type:"use",amount:-a,balance_after:p,description:`${n} (${s?.platform||s?.agentRole||""})`}),i.NextResponse.json({result:e,points_used:a,points_remaining:p})}catch(e){return console.error("Agent error:",e),i.NextResponse.json({error:"AI処理に失敗しました",detail:e.message},{status:500})}}let d=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/agents/route",pathname:"/api/agents",filename:"route",bundlePath:"app/api/agents/route"},resolvedPagePath:"/home/claude/aimo-app/src/app/api/agents/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:g,staticGenerationAsyncStorage:m,serverHooks:h}=d,y="/api/agents/route";function _(){return(0,o.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:m})}},90020:(e,t,r)=>{r.d(t,{sg:()=>p,Fc:()=>c,Mz:()=>u,iE:()=>i});let n=require("@anthropic-ai/sdk"),s=new(r.n(n)())({apiKey:process.env.ANTHROPIC_API_KEY}),a={cmo:`あなたはAIMOのCMOエージェントです。集客戦略の専門家として、データに基づいた実践的な施策を提案します。
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
{ "reply": "返答文", "tone": "friendly|professional|apologetic", "type": "general|complaint|inquiry|praise" }`};async function o(e,t,r){let n=[];r&&(n.push({role:"user",content:`コンテキスト情報:
${r}`}),n.push({role:"assistant",content:"コンテキストを理解しました。"})),n.push({role:"user",content:t});let o=await s.messages.create({model:"claude-sonnet-4-20250514",max_tokens:1024,system:a[e],messages:n}),i=o.content.find(e=>"text"===e.type)?.text||"{}";try{let e=i.replace(/```json\n?|```\n?/g,"").trim();return JSON.parse(e)}catch{return{raw:i}}}async function i(e){return o("sns",`
媒体: ${e.platform}
業種: ${e.businessType}
トピック: ${e.topic}
トーン: ${e.tone}
ターゲット: ${e.targetAudience}

上記の条件で、${e.platform}に最適化した投稿文を生成してください。
`)}async function p(e){return o("reply",`
プラットフォーム: ${e.platform}
ブランドトーン: ${e.brandTone}
送信者名: ${e.senderName}
受信メッセージ: "${e.originalText}"

上記のメッセージへの返答を生成してください。
`)}async function c(e){return o("sns",`
店舗名: ${e.businessName}
投稿タイプ: ${e.postType}
トピック/内容: ${e.topic}
${e.season?`季節: ${e.season}`:""}

Googleビジネスプロフィール向けの投稿文を生成してください。
240文字以内で、CTAを含め、来店・問い合わせを促す内容にしてください。
`)}async function u(e){return o(e.agentRole,`以下のデータを分析して改善提案を生成してください:
${e.analyticsData}`)}},90275:(e,t,r)=>{r.d(t,{i3:()=>i,fU:()=>o});var n=r(67721),s=r(37857),a=r(71615);function o(){let e=(0,a.cookies)();return(0,n.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://placeholder.supabase.co",process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"placeholder",{cookies:{get:t=>e.get(t)?.value,set(t,r,n){try{e.set({name:t,value:r,...n})}catch{}},remove(t,r){try{e.set({name:t,value:"",...r})}catch{}}}})}function i(){return(0,s.eI)(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://placeholder.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY||"placeholder",{auth:{autoRefreshToken:!1,persistSession:!1}})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),n=t.X(0,[948,355,972],()=>r(34521));module.exports=n})();