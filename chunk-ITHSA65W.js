import{a as p}from"./chunk-THQFE5EJ.js";import{a as e}from"./chunk-V7PS37KS.js";import{M as g}from"./chunk-N4IRQX5R.js";import{$ as m,e as u,fa as c}from"./chunk-G5N7VOAE.js";var G=(()=>{class o{constructor(){this.toast=c(g),this.network=c(p)}get apiKey(){return localStorage.getItem(e.storageKeys.geminiApiKey)??""}get modelMode(){return localStorage.getItem(e.storageKeys.modelMode)??"manual"}get currentModel(){return this.modelMode==="gradual"?this.getGradualModel():localStorage.getItem(e.storageKeys.selectedModel)??e.modelsGradual[0]}getGradualModel(){let t=new Date().toISOString().slice(0,10);localStorage.getItem(e.storageKeys.gradualModelResetDate)!==t&&(localStorage.setItem(e.storageKeys.gradualModelResetDate,t),localStorage.setItem(e.storageKeys.gradualCurrentModelIndex,"0"));let n=parseInt(localStorage.getItem(e.storageKeys.gradualCurrentModelIndex)??"0");return e.modelsGradual[Math.min(n,e.modelsGradual.length-1)]}advanceGradualModel(){let t=parseInt(localStorage.getItem(e.storageKeys.gradualCurrentModelIndex)??"0"),r=Math.min(t+1,e.modelsGradual.length-1);localStorage.setItem(e.storageKeys.gradualCurrentModelIndex,r.toString()),this.toast.warning(`\u041F\u0435\u0440\u0435\u043C\u0438\u043A\u0430\u0454\u043C\u043E\u0441\u044C \u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C: ${e.modelsGradual[r]}`)}generateTopic(t){return u(this,null,function*(){if(!this.network.isOnline())return this.toast.error("\u0412\u0438 \u043E\u0444\u043B\u0430\u0439\u043D. \u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0456\u044F \u043D\u0435\u043C\u043E\u0436\u043B\u0438\u0432\u0430 \u0431\u0435\u0437 \u0456\u043D\u0442\u0435\u0440\u043D\u0435\u0442\u0443."),null;if(!this.apiKey)return this.toast.error("\u0411\u0443\u0434\u044C \u043B\u0430\u0441\u043A\u0430, \u0432\u0432\u0435\u0434\u0456\u0442\u044C \u0432\u0430\u0448 API \u043A\u043B\u044E\u0447 Gemini \u0443 \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F\u0445."),null;let r=this.buildTopicPrompt(t);return this.callGeminiWithRetry(r)})}callGeminiWithRetry(t,r=0){return u(this,null,function*(){let n=this.currentModel,h=`${e.geminiBaseUrl}/${n}:generateContent?key=${this.apiKey}`;try{let a=yield fetch(h,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:t}]}],generationConfig:{responseMimeType:"application/json",temperature:.7}})}),s=yield a.json();if(!a.ok||s.error){let l=s.error?.code??a.status,i=s.error?.message??a.statusText;if(l===429&&(i.includes("quota")||i.includes("QUOTA")))return this.modelMode==="gradual"&&(this.advanceGradualModel(),r<e.modelsGradual.length-1)?this.callGeminiWithRetry(t,r+1):(this.toast.error(`\u041B\u0456\u043C\u0456\u0442 \u0437\u0430\u043F\u0438\u0442\u0456\u0432 Gemini \u0432\u0438\u0447\u0435\u0440\u043F\u0430\u043D\u043E. \u0421\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u0456\u0437\u043D\u0456\u0448\u0435. (${i})`),null);if(l===429)return this.toast.warning(`\u041B\u0456\u043C\u0456\u0442 \u0437\u0430 \u0445\u0432\u0438\u043B\u0438\u043D\u0443. \u0427\u0435\u043A\u0430\u0454\u043C\u043E ${e.rateLimitWaitMinutes} \u0445\u0432...`),yield this.sleep(e.rateLimitWaitMinutes*60*1e3),this.callGeminiWithRetry(t,r);throw new Error(`Gemini API error ${l}: ${i}`)}let d=s.candidates?.[0]?.content?.parts?.[0]?.text;if(!d)throw new Error("\u041F\u043E\u0440\u043E\u0436\u043D\u044F \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u044C \u0432\u0456\u0434 Gemini");let v=d.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();return JSON.parse(v)}catch(a){return this.toast.error(`\u041F\u043E\u043C\u0438\u043B\u043A\u0430 Gemini: ${a.message??a}`),null}})}sleep(t){return new Promise(r=>setTimeout(r,t))}buildTopicPrompt(t){let{min:r,max:n}=e.wordsPerTopic;return`You are a European Portuguese language teacher. Generate a vocabulary learning set for the topic: "${t}".

Return ONLY a JSON object (no markdown blocks) with this exact structure:
{
  "topicTitle": "Topic name in Ukrainian",
  "words": [
    {
      "word": "Portuguese word",
      "translation": "Ukrainian translation",
      "transcription": "IPA or simplified phonetic transcription",
      "type": "noun" | "verb" | "adjective",
      "gender": "m" | "f" | null,
      "plural": "plural form or null (for nouns only)",
      "conjugations": {
        "presente": {"eu": "...", "tu": "...", "ele/ela": "...", "n\xF3s": "...", "v\xF3s": "...", "eles/elas": "..."},
        "preteritoPerfeito": {"eu": "...", "tu": "...", "ele/ela": "...", "n\xF3s": "...", "v\xF3s": "...", "eles/elas": "..."},
        "preteritoImperfeito": {"eu": "...", "tu": "...", "ele/ela": "...", "n\xF3s": "...", "v\xF3s": "...", "eles/elas": "..."},
        "futuro": {"eu": "...", "tu": "...", "ele/ela": "...", "n\xF3s": "...", "v\xF3s": "...", "eles/elas": "..."},
        "imperativo": {"tu": "...", "voc\xEA": "...", "n\xF3s": "...", "voc\xEAs": "..."}
      } or null (for verbs only),
      "comparative": "comparative form or null (for adjectives only)",
      "superlative": "superlative form or null (for adjectives only)",
      "examples": [
        {"pt": "Example sentence in Portuguese", "ua": "Ukrainian translation"},
        {"pt": "Second example sentence", "ua": "Ukrainian translation"}
      ],
      "note": "Optional note about exceptions, special usage, or regional notes. null if none.",
      "distractors": ["similar_word_1", "similar_word_2", "similar_word_3"],
      "distractorTranslations": ["translation_1", "translation_2", "translation_3"]
    }
  ]
}

Rules:
- Generate between ${r} and ${n} words covering nouns, verbs, and adjectives relevant to the topic "${t}".
- Use EUROPEAN Portuguese (Portugal dialect), NOT Brazilian Portuguese.
- All translations and notes must be in Ukrainian.
- Distractors must be real Portuguese words that are either semantically similar, sound similar, or have similar spelling to the original word \u2014 making them genuinely confusing for learners. Provide exactly 3 distractors per word.
- DistractorTranslations must be the exact Ukrainian translations of the 3 distractors provided.
- For nouns, always provide gender and plural. Set conjugations, comparative, superlative to null.
- For verbs, always provide conjugations for all 5 tenses. Set gender, plural, comparative, superlative to null.
- For adjectives, always provide comparative and superlative. Set gender, plural, conjugations to null.
- Always return valid JSON. Do not include any text outside the JSON object.`}static{this.\u0275fac=function(r){return new(r||o)}}static{this.\u0275prov=m({token:o,factory:o.\u0275fac,providedIn:"root"})}}return o})();export{G as a};
