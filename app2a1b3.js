function renderFeed(){
  const el=$('feed');
  if(!el)return;
  const items=state().feedCache||[];
  el.innerHTML='';
  if(!items.length){
    el.innerHTML='<article class="card"><p class="muted">Nenhuma publicação encontrada ainda.</p></article>';
    return;
  }
  items.forEach(x=>{
    const card=document.createElement('article');
    card.className='card post';
    card.dataset.type=x._type;
    card.dataset.id=x.id;
    const cover=x.image?`<img src="${state().esc(x.image)}">`:(x._type==='trail'?'⛰️':'🦜');
    const title=state().esc(x.name||x.species||x.type);
    const meta=`${state().esc(author(x))} · ${state().dt(x.start_time||x.created_at)}${x.place?' · '+state().esc(x.place):''}`;
    const badge=x._type==='trail'?'TRILHA':'VIDA SELVAGEM';
    const stat=x._type==='trail'?state().km(x.distance_meters):state().esc(x.type);
    const description=state().esc(x.description||x.notes||x.behavior||'Uma nova descoberta compartilhada na comunidade.');
    card.innerHTML=`<div class="post-cover">${cover}<span class="post-badge">${badge}</span></div><div class="post-body"><div class="post-head"><div><h3>${title}</h3><div class="meta">${meta}</div></div><span class="pill">${stat}</span></div><p class="muted">${description}</p><div class="social-row"><button class="social like">♥ ${x.likes_count||0}</button><button class="social detail">💬 ${x.comments_count||0}</button><button class="social share">↗ Compartilhar</button></div></div>`;
    card.querySelector('.detail').onclick=()=>openDetail(x._type,x.id);
    card.querySelector('.like').onclick=()=>toggleLike(x._type,x.id);
    card.querySelector('.share').onclick=()=>shareItem(x._type,x.id);
    el.appendChild(card);
  });
}
