(() => {
  // API endpoint
  const ENDPOINT = "https://tbot-api.vercel.app/api/tbot";

  // DOM
  const $bubble   = document.getElementById('tbot-bubble');
  const $composer = document.getElementById('tbot-composer');
  const $input    = document.getElementById('tbot-input');
  const $send     = document.getElementById('tbot-send');
  const $stack    = document.getElementById('tbot-stack');

  // Mobile header avatar toggles chat
  const headerAvatar = document.querySelector('.header-avatar');
  if (headerAvatar) {
    headerAvatar.addEventListener('click', () => {
      $composer.classList.contains('open') ? closeComposer() : openComposer();
    });
  }

  // ---- Client daily quota (saves money) ----
  const DAY = 86400000, CAP = 20; // 20 messages/day per browser
  let quota = JSON.parse(localStorage.getItem('tbotQuota') || '{"d":0,"n":0}');
  const today = Math.floor(Date.now() / DAY);
  if (quota.d !== today) quota = { d: today, n: 0 };
  function takeQuota() {
    if (quota.n >= CAP) return false;
    quota.n++; localStorage.setItem('tbotQuota', JSON.stringify(quota));
    return true;
  }

  // ---- UI helpers ----
  let history = [];
  let pending = false;
  let hoverTimer = null;

  function openComposer(){
    $composer.classList.add('open');
    $stack.style.display = 'block';
    setTimeout(()=> $input && $input.focus(), 0);
  }
  function closeComposer(){ $composer.classList.remove('open'); }

  // Hover on desktop; click on both desktop/mobile
  if ($bubble) {
    $bubble.addEventListener('pointerenter', () => { clearTimeout(hoverTimer); openComposer(); });
    $bubble.addEventListener('pointerleave', () => {
      hoverTimer = setTimeout(() => { if(!$input.matches(':focus')) closeComposer(); }, 200);
    });
    $bubble.addEventListener('click', () => {
      $composer.classList.contains('open') ? closeComposer() : openComposer();
    });
  }
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeComposer(); });

  function addCard(role, text){
    const div = document.createElement('div');
    div.className = `tbot-card ${role === 'user' ? 'tbot-user' : 'tbot-bot'}`;
    div.textContent = text;
    $stack.appendChild(div);
    $stack.scrollTop = $stack.scrollHeight;
  }

  // ---- Submit ----
  $composer.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (pending) return;

    const text = $input.value.trim();
    if (!text) return;

    // Client daily cap
    if (!takeQuota()) {
      addCard('assistant','Daily limit reached. Please try again tomorrow.');
      return;
    }

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

      if (!res.ok) {
        // Surface server’s detail to help debugging
        placeholder.textContent = (data && (data.detail || data.error)) || 'Server error';
        return;
      }

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
