"use strict";(()=>{var e={};e.id=446,e.ids=[446],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},65604:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>h,patchFetch:()=>y,requestAsyncStorage:()=>g,routeModule:()=>m,serverHooks:()=>f,staticGenerationAsyncStorage:()=>_});var n={};s.r(n),s.d(n,{GET:()=>l,POST:()=>d});var r=s(49303),a=s(88716),o=s(60670),i=s(87070),p=s(90275),c=s(90020);async function u(e,t,s){let n={summary:s.content};"event"===s.post_type&&s.event_start&&(n.event={title:s.title||"イベント",schedule:{startDate:s.event_start?.split("T")[0],endDate:(s.event_end||s.event_start)?.split("T")[0]}}),s.cta_type&&s.cta_url&&(n.callToAction={actionType:s.cta_type,url:s.cta_url});let r=await fetch(`https://mybusiness.googleapis.com/v4/accounts/-/locations/${t}/localPosts`,{method:"POST",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json"},body:JSON.stringify(n)});if(!r.ok)throw Error(`GMB API error: ${await r.text()}`);return r.json()}async function l(e){let t=(0,p.fU)(),{data:{user:s}}=await t.auth.getUser();if(!s)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{data:n}=await t.from("gmb_posts").select("*").eq("user_id",s.id).order("created_at",{ascending:!1}).limit(30);return i.NextResponse.json(n||[])}async function d(e){let t=(0,p.fU)(),{data:{user:s}}=await t.auth.getUser();if(!s)return i.NextResponse.json({error:"Unauthorized"},{status:401});let n=await e.json(),{action:r}=n;if("generate"===r){let{data:e}=await t.from("profiles").select("points").eq("id",s.id).single();if(!e||e.points<5)return i.NextResponse.json({error:"ポイントが不足しています"},{status:402});let r=await (0,c.Fc)(n.params),a=e.points-5;return await t.from("profiles").update({points:a}).eq("id",s.id),await t.from("point_transactions").insert({user_id:s.id,type:"use",amount:-5,balance_after:a,description:"GMB投稿生成"}),i.NextResponse.json({result:r,points_remaining:a})}if("save"===r){let{location_id:e,location_name:r,post_type:a,title:o,content:p,cta_type:c,cta_url:u,event_start:l,event_end:d,scheduled_at:m}=n,{data:g,error:_}=await t.from("gmb_posts").insert({user_id:s.id,location_id:e,location_name:r,post_type:a,title:o,content:p,cta_type:c,cta_url:u,event_start:l,event_end:d,scheduled_at:m,status:m?"scheduled":"draft"}).select().single();return _?i.NextResponse.json({error:_.message},{status:500}):i.NextResponse.json(g)}if("publish"===r){let{post_id:e}=n,{data:r}=await t.from("gmb_posts").select("*").eq("id",e).single();if(!r)return i.NextResponse.json({error:"Post not found"},{status:404});let{data:a}=await t.from("sns_accounts").select("access_token").eq("user_id",s.id).eq("platform","gmb").single();if(!a?.access_token)return i.NextResponse.json({error:"Googleアカウントが連携されていません"},{status:400});try{let s=await u(a.access_token,r.location_id,r);return await t.from("gmb_posts").update({status:"published",published_at:new Date().toISOString(),gmb_post_name:s.name}).eq("id",e),i.NextResponse.json({ok:!0,gmb_name:s.name})}catch(s){return await t.from("gmb_posts").update({status:"failed"}).eq("id",e),i.NextResponse.json({error:s.message},{status:500})}}return i.NextResponse.json({error:"Invalid action"},{status:400})}let m=new r.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/gmb/route",pathname:"/api/gmb",filename:"route",bundlePath:"app/api/gmb/route"},resolvedPagePath:"/home/claude/aimo-app/src/app/api/gmb/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:g,staticGenerationAsyncStorage:_,serverHooks:f}=m,h="/api/gmb/route";function y(){return(0,o.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:_})}},90020:(e,t,s)=>{s.d(t,{sg:()=>p,Fc:()=>c,Mz:()=>u,iE:()=>i});let n=require("@anthropic-ai/sdk"),r=new(s.n(n)())({apiKey:process.env.ANTHROPIC_API_KEY}),a={cmo:`あなたはAIMOのCMOエージェントです。集客戦略の専門家として、データに基づいた実践的な施策を提案します。
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
{ "reply": "返答文", "tone": "friendly|professional|apologetic", "type": "general|complaint|inquiry|praise" }`};async function o(e,t,s){let n=[];s&&(n.push({role:"user",content:`コンテキスト情報:
${s}`}),n.push({role:"assistant",content:"コンテキストを理解しました。"})),n.push({role:"user",content:t});let o=await r.messages.create({model:"claude-sonnet-4-20250514",max_tokens:1024,system:a[e],messages:n}),i=o.content.find(e=>"text"===e.type)?.text||"{}";try{let e=i.replace(/```json\n?|```\n?/g,"").trim();return JSON.parse(e)}catch{return{raw:i}}}async function i(e){return o("sns",`
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
${e.analyticsData}`)}},90275:(e,t,s)=>{s.d(t,{i3:()=>i,fU:()=>o});var n=s(67721),r=s(37857),a=s(71615);function o(){let e=(0,a.cookies)();return(0,n.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://placeholder.supabase.co",process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||"placeholder",{cookies:{get:t=>e.get(t)?.value,set(t,s,n){try{e.set({name:t,value:s,...n})}catch{}},remove(t,s){try{e.set({name:t,value:"",...s})}catch{}}}})}function i(){return(0,r.eI)(process.env.NEXT_PUBLIC_SUPABASE_URL||"https://placeholder.supabase.co",process.env.SUPABASE_SERVICE_ROLE_KEY||"placeholder",{auth:{autoRefreshToken:!1,persistSession:!1}})}}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),n=t.X(0,[948,355,972],()=>s(65604));module.exports=n})();