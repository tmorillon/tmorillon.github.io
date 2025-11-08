(() => {
  // If your backend is same-origin, leave as-is. Otherwise set to your API URL.
  // script/T_bot.js
  const ENDPOINT = "https://tbot-api.vercel.app/api/tbot";


  const $bubble = document.getElementById('tbot-bubble');
  const $composer = document.getElementById('tbot-composer');
  const $input = document.getElementById('tbot-input');
  const $send = document.getElementById('tbot-send');
  const $stack = document.getElementById('tbot-stack');

  let history = [];
  let pending = false;
  let hoverTimer = null;

  function openComposer(){ $composer.classList.add('open'); $stack.style.display='block'; setTimeout(()=> $input.focus(),0); }
  function closeComposer(){ $composer.classList.remove('open'); }

  // Hover opens on desktop; click toggles (works for mobile tap)
  $bubble.addEventListener('pointerenter', () => { clearTimeout(hoverTimer); openComposer(); });
  $bubble.addEventListener('pointerleave', () => { hoverTimer = setTimeout(() => { if(!$input.matches(':focus')) closeComposer(); }, 200); });
  $bubble.addEventListener('click', () => { $composer.classList.contains('open') ? closeComposer() : openComposer(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeComposer(); });

  function addCard(role, text){
    const div = document.createElement('div');
    div.className = `tbot-card ${role === 'user' ? 'tbot-user' : 'tbot-bot'}`;
    div.textContent = text;
    $stack.appendChild(div);
    $stack.scrollTop = $stack.scrollHeight;
  }

  $composer.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (pending) return;
    const text = $input.value.trim();
    if (!text) return;

    addCard('user', text);
    history.push({ role:'user', content:text });
    $input.value = '';

    addCard('assistant', '…'); // placeholder
    const placeholder = $stack.lastChild;

    pending = true; $send.disabled = true;
    try{
      const res = await fetch(ENDPOINT, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ messages: history.slice(-20) })
      });
      const data = await res.json();
      const reply = data.reply || '(no reply)';
      placeholder.textContent = reply;
      history.push({ role:'assistant', content: reply });
    }catch(err){
      placeholder.textContent = 'Error contacting T-bot.';
    }finally{
      pending = false; $send.disabled = false;
    }
  });
})();
