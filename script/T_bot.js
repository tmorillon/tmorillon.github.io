(() => {
  const ENDPOINT = "https://tbot-api.tmorillon.workers.dev";

  // Avatar poses - cycles on each reply
  const POSES = [
    "Images/Mini-Me_arms_crossed_transparent.png",
    "Images/Mini-Me_thumbs_up_transparent.png",
    "Images/Mini-Me_coffee_transparent.png",
    "Images/Mini-Me_Shush_transparent.png",
  ];
  let poseIndex = 0;

  // DOM
  const $bubble   = document.getElementById('tbot-bubble');
  const $bubbleImg = $bubble ? $bubble.querySelector('img') : null;
  const $composer = document.getElementById('tbot-composer');
  const $input    = document.getElementById('tbot-input');
  const $send     = document.getElementById('tbot-send');
  const $stack    = document.getElementById('tbot-stack');

  // Mobile header avatar toggles chat
  const headerAvatar = document.querySelector('.header-avatar');
  if (headerAvatar) {
    headerAvatar.addEventListener('click', (e) => {
      e.preventDefault();
      toggleChat();
    });
  }

  // ---- Client daily quota ----
  const DAY = 86400000, CAP = 20;
  let quota = JSON.parse(localStorage.getItem('tbotQuota') || '{"d":0,"n":0}');
  const today = Math.floor(Date.now() / DAY);
  if (quota.d !== today) quota = { d: today, n: 0 };
  function takeQuota() {
    if (quota.n >= CAP) return false;
    quota.n++; localStorage.setItem('tbotQuota', JSON.stringify(quota));
    return true;
  }

  // ---- State ----
  let history = [];
  let pending = false;
  let chatOpen = false;

  function toggleChat() {
    chatOpen ? closeChat() : openChat();
  }

  const $wrap = document.getElementById('tbot-chat-wrap');

  function openChat() {
    chatOpen = true;
    $wrap.classList.add('open');
    $composer.classList.add('open');
    $stack.classList.add('open');
    $bubble.classList.add('chat-active');
    setTimeout(() => $input && $input.focus(), 0);
  }

  function closeChat() {
    chatOpen = false;
    $wrap.classList.remove('open');
    $composer.classList.remove('open');
    $stack.classList.remove('open');
    $bubble.classList.remove('chat-active');
  }

  function cyclePose() {
    if (!$bubbleImg) return;
    poseIndex = (poseIndex + 1) % POSES.length;
    $bubbleImg.src = POSES[poseIndex];
  }

  // Click only - no hover
  if ($bubble) {
    $bubble.addEventListener('click', toggleChat);
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeChat(); });

  function addCard(role, text) {
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

    if (!takeQuota()) {
      addCard('assistant', 'Daily limit reached. Please try again tomorrow.');
      return;
    }

    addCard('user', text);
    history.push({ role: 'user', content: text });
    $input.value = '';

    addCard('assistant', '...');
    const placeholder = $stack.lastChild;

    pending = true; $send.disabled = true;
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-6) })
      });

      const data = await res.json();

      if (!res.ok) {
        placeholder.textContent = (data && (data.detail || data.error)) || 'Server error';
        return;
      }

      const reply = data.reply || '(no reply)';
      placeholder.textContent = reply;
      history.push({ role: 'assistant', content: reply });
      cyclePose();

    } catch (err) {
      placeholder.textContent = 'Hmm, having trouble connecting. Try again in a moment.';
    } finally {
      pending = false; $send.disabled = false;
    }
  });
})();
