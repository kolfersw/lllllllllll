// Classic script: works with file:// without module loading.
(()=>{
const enc=new TextEncoder(),dec=new TextDecoder();
function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s)}
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function key(password,salt,usage){const raw=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,[usage])}
async function seal(data,password){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(password,salt,'encrypt'),enc.encode(JSON.stringify(data)));return {version:1,salt:base64(salt),iv:base64(iv),cipher:base64(new Uint8Array(cipher))}}
async function open(data,password){if(data.version!==1)throw Error('version');return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(data.iv)},await key(password,bytes(data.salt),'decrypt'),bytes(data.cipher))))}
function mediaURL(file){return URL.createObjectURL(new Blob([bytes(file.data)],{type:file.type}))}


const $=s=>document.querySelector(s);let retained={audio:null,video:null};
function content(){return {title:$('#title').value,paragraphs:$('#paragraphs').value.trim().split(/\n\s*\n/).filter(Boolean),finalMessage:$('#final').value,timing:{unfold:+$('#unfold').value,title:+$('#titleTime').value,reveal:+$('#reveal').value,move:+$('#move').value,pause:+$('#pause').value}}}
function download(name,data){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000)}
async function file(id){const f=$(id).files[0];if(!f)return retained[id.slice(1)];return {type:f.type||(id==='#video'?'video/mp4':'audio/mp4'),data:base64(new Uint8Array(await f.arrayBuffer()))}}
$('#editor').onsubmit=async e=>{e.preventDefault();const total=['#audio','#video'].reduce((n,id)=>n+($(id).files[0]?.size||0),0);if(total>50*1024*1024){$('#status').textContent='Вложения слишком большие. Сожмите их до суммарных 50 МБ или меньше.';return}$('#save').disabled=true;$('#status').textContent='Шифруем письмо…';try{download('letter.enc.json',await seal({...content(),audio:await file('#audio'),video:await file('#video')},$('#password').value.toUpperCase()));$('#status').textContent='Готово. Замените letter.enc.json в папке сайта скачанным файлом. Не загружайте открытый черновик на GitHub.'}catch{$('#status').textContent='Не удалось сохранить. Попробуйте открыть редактор в современном Chrome или Safari. Если браузер блокирует шифрование из файла, откройте редактор через localhost.'}finally{$('#save').disabled=false}};
$('#draft').onclick=()=>{download('private-letter-draft.json',content());$('#status').textContent='Сохранён открытый текст без пароля и вложений. Храните его отдельно от публичного репозитория.'};
$('#import').onchange=async()=>{try{const d=JSON.parse(await $('#import').files[0].text());if(typeof d.title!=='string'||!Array.isArray(d.paragraphs)||!d.paragraphs.every(x=>typeof x==='string')||typeof d.finalMessage!=='string')throw Error();$('#title').value=d.title;$('#paragraphs').value=d.paragraphs.join('\n\n');$('#final').value=d.finalMessage;for(const k of ['unfold','reveal','move','pause'])if(Number.isFinite(d.timing?.[k]))$('#'+k).value=d.timing[k];if(Number.isFinite(d.timing?.title))$('#titleTime').value=d.timing.title;$('#status').textContent='Текст открыт. Выберите вложения и задайте пароль перед сохранением.'}catch{$('#status').textContent='Не удалось прочитать черновик. Нужен private-letter-draft.json из этого редактора.'}};

})();
