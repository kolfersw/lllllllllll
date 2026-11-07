const enc=new TextEncoder(),dec=new TextDecoder();
export function base64(bytes){let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s)}
const bytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function key(password,salt,usage){const raw=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,[usage])}
export async function seal(data,password){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(password,salt,'encrypt'),enc.encode(JSON.stringify(data)));return {version:1,salt:base64(salt),iv:base64(iv),cipher:base64(new Uint8Array(cipher))}}
export async function open(data,password){if(data.version!==1)throw Error('version');return JSON.parse(dec.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(data.iv)},await key(password,bytes(data.salt),'decrypt'),bytes(data.cipher))))}
export function mediaURL(file){return URL.createObjectURL(new Blob([bytes(file.data)],{type:file.type}))}
