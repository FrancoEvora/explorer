(async()=>{
  'use strict';
  const BASE='https://cdn.jsdelivr.net/gh/FrancoEvora/explorer@107082b134c4ce3e97da4b1a47cec843ffac7886/release/gzip-v402/';
  const PARTS=['part00.b64','part01.b64','part02.b64','part03.b64','part04.b64','part05.b64'];
  const status=document.getElementById('status');
  const fail=(error)=>{console.error(error);if(status)status.textContent='Falha ao abrir: '+(error?.message||String(error));document.querySelector('.bar')?.remove();};
  try{
    if('serviceWorker' in navigator){for(const registration of await navigator.serviceWorker.getRegistrations())await registration.unregister();}
    if('caches' in window){for(const key of await caches.keys())await caches.delete(key);}
    if(typeof DecompressionStream!=='function')throw new Error('Este navegador não oferece descompressão GZIP nativa. Atualize o iOS.');
    if(status)status.textContent='Baixando a compilação estável…';
    const parts=await Promise.all(PARTS.map(async(name)=>{const response=await fetch(BASE+name+'?v=4.0.2',{cache:'no-store'});if(!response.ok)throw new Error('Arquivo ausente: '+name);return response.text();}));
    const encoded=parts.join('').replace(/\s+/g,'');
    const binary=atob(encoded);
    const bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    if(status)status.textContent='Abrindo o Explorer 4.0.2…';
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const html=await new Response(stream).text();
    if(!html.includes('<title>Explorer 4.0.2</title>'))throw new Error('Pacote de produção inválido.');
    document.open();document.write(html);document.close();
  }catch(error){fail(error);}
})();
