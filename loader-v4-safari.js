(async()=>{
  'use strict';
  const BASE='https://raw.githubusercontent.com/FrancoEvora/explorer/fca3712b907f7381d9f479bb941bab2d928918ab/bootstrap_v4/';
  const PARTS=['part00.b64','part01.b64','part02.b64','part03.b64','part040.b64'];
  const status=document.getElementById('status');
  try{
    if('serviceWorker' in navigator){for(const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister();}
    if('caches' in window){for(const key of await caches.keys()) await caches.delete(key);}
    status.textContent='Baixando a compilação definitiva…';
    const parts=await Promise.all(PARTS.map(async name=>{
      const response=await fetch(BASE+name+'?safari=1',{cache:'no-store'});
      if(!response.ok) throw new Error('Arquivo de produção ausente: '+name);
      return response.text();
    }));
    const encoded=parts.join('').replace(/\s+/g,'');
    const binary=atob(encoded);
    const compressed=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) compressed[i]=binary.charCodeAt(i);
    status.textContent='Descompactando o Explorer 4.0…';
    const module=await import('https://cdn.jsdelivr.net/npm/xz-decompress@0.2.3/+esm');
    const XzReadableStream=module.XzReadableStream || module.default?.XzReadableStream || module.default;
    if(typeof XzReadableStream!=='function') throw new Error('O descompactador não foi carregado pelo navegador.');
    const inputStream=new Blob([compressed]).stream();
    const html=await new Response(new XzReadableStream(inputStream)).text();
    if(!html.includes('<title>Explorer 4.0</title>')) throw new Error('A compilação recebida não é o Explorer 4.0.');
    document.open();document.write(html);document.close();
  }catch(error){
    console.error(error);
    status.textContent='Falha ao abrir: '+(error?.message||String(error));
    document.querySelector('.bar')?.remove();
  }
})();
