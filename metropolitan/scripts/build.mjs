import {mkdir,cp,rm,access} from 'node:fs/promises';
const files=['index.html','styles.css','app.js','assets'];
for(const file of [...files,'assets/implantacao.png','assets/portaria.webp','assets/convivencia.webp','assets/logistica.webp','assets/visao-aerea.jpg']) await access(file);
await rm('dist',{recursive:true,force:true}); await mkdir('dist',{recursive:true});
for(const file of files) await cp(file,`dist/${file}`,{recursive:true});
console.log('Metropolitan: build concluído com todas as imagens.');
