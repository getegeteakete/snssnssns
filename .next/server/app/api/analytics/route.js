"use strict";(()=>{var e={};e.id=567,e.ids=[567],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},1681:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>h,patchFetch:()=>g,requestAsyncStorage:()=>d,routeModule:()=>u,serverHooks:()=>y,staticGenerationAsyncStorage:()=>m});var r={};a.r(r),a.d(r,{GET:()=>p});var n=a(49303),s=a(88716),o=a(60670),i=a(87070),c=a(90275),l=a(90020);async function p(e){let t=(0,c.fU)(),{data:{user:a}}=await t.auth.getUser();if(!a)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:r}=new URL(e.url),n=r.get("range")||"30d",s=new Date(Date.now()-864e5*("7d"===n?7:"90d"===n?90:30)).toISOString().slice(0,10),{data:o}=await t.from("analytics_snapshots").select("*").eq("user_id",a.id).gte("date",s).order("date",{ascending:!0});if(!o||0===o.length)return i.NextResponse.json({total_pv:0,total_cv:0,cvr:"0.00",total_reach:0,daily_pv:[],platform_breakdown:[],ai_insights:["データが蓄積されるとここにAIインサイトが表示されます。"]});let p={},u=0,d=0,m=0,y={};for(let e of o)p[e.date]||(p[e.date]={date:e.date.slice(5),pv:0,cv:0}),"page_views"===e.metric_type&&(u+=Number(e.value),p[e.date].pv+=Number(e.value)),"conversions"===e.metric_type&&(d+=Number(e.value),p[e.date].cv+=Number(e.value)),"reach"===e.metric_type&&(m+=Number(e.value)),["twitter","instagram","facebook","line","gmb"].includes(e.platform)&&(y[e.platform]=(y[e.platform]||0)+Number(e.value));let h=u>0?(d/u*100).toFixed(2):"0.00",g=Object.entries(y).map(([e,t])=>({platform:e,visits:t})),_=[];try{let e=`PV: ${u}, CV: ${d}, CVR: ${h}%, 期間: ${n}, 媒体別流入: ${JSON.stringify(g)}`,t=await (0,l.Mz)({analyticsData:e,agentRole:"analytics"});t.recommendation&&(_=[t.insight,t.recommendation])}catch{}return i.NextResponse.json({total_pv:u,total_cv:d,cvr:h,total_reach:m,daily_pv:Object.values(p),platform_breakdown:g,ai_insights:_.length>0?_:["分析データを蓄積中です。"]})}let u=new n.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/analytics/route",pathname:"/api/analytics",filename:"route",bundlePath:"app/api/analytics/route"},resolvedPagePath:"/home/claude/aimo-app/src/app/api/analytics/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:d,staticGenerationAsyncStorage:m,serverHooks:y}=u,h="/api/analytics/route";function g(){return(0,o.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:m})}},90020:(e,t,a)=>{a.d(t,{sg:()=>c,Fc:()=>l,Mz:()=>p,iE:()=>i});let r=require("@anthropic-ai/sdk"),n=new(a.n(r)())({apiKey:process.env.ANTHROPIC_API_KEY}),s={cmo:`あなたはAIMOのCMOエージェントです。集客戦略の専門家として、データに基づいた実践的な施策を提案します。
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
{ "reply": "返答文", "tone": "friendly|professional|apologetic", "type": "general|complaint|inquiry|praise" }`};async function o(e,t,a){let r=[];a&&(r.push({role:"user",content:`コンテキスト情報:
${a}`}),r.push({role:"assistant",content:"コンテキストを理解しました。"})),r.push({role:"user",content:t});let o=await n.messages.create({model:"claude-sonnet-4-20250514",max_tokens:1024,system:s[e],messages:r}),i=o.content.find(e=>"text"===e.type)?.text||"{}";try{let e=i.replace(/```json\n?|```\n?/g,"").trim();return JSON.parse(e)}catch{return{raw:i}}}async function i(e){return o("sns",`
媒体: ${e.platform}
業種: ${e.businessType}
トピック: ${e.topic}
トーン: ${e.tone}
ターゲット: ${e.targetAudience}

上記の条件で、${e.platform}に最適化した投稿文を生成してください。
`)}async function c(e){return o("reply",`
プラットフォーム: ${e.platform}
ブランドトーン: ${e.brandTone}
送信者名: ${e.senderName}
受信メッセージ: "${e.originalText}"

上記のメッセージへの返答を生成してください。
`)}async function l(e){return o("sns",`
店舗名: ${e.businessName}
投稿タイプ: ${e.postType}
トピック/内容: ${e.topic}
${e.season?`季節: ${e.season}`:""}

Googleビジネスプロフィール向けの投稿文を生成してください。
240文字以内で、CTAを含め、来店・問い合わせを促す内容にしてください。
`)}async function p(e){return o(e.agentRole,`以下のデータを分析して改善提案を生成してください:
${e.analyticsData}`)}},90275:(e,t,a)=>{a.d(t,{i3:()=>i,fU:()=>o});var r=a(67721),n=a(37857),s=a(71615);function o(){let e=(0,s.cookies)();return(0,r.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://placeholder.supabase.co",process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"placeholder",{cookies:{get:t=>e.get(t)?.value,set(t,a,r){try{e.set({name:t,value:a,...r})}catch{}},remove(t,a){try{e.set({name:t,value:"",...a})}catch{}}}})}function i(){return(0,n.eI)(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://placeholder.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY||"placeholder",{auth:{autoRefreshToken:!1,persistSession:!1}})}}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[948,355,972],()=>a(1681));module.exports=r})();