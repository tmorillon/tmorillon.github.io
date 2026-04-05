// ======== typed.js integration =========
// Include this in your script folder as 'typed_init.js'

document.addEventListener('DOMContentLoaded', () => {
  const target = document.getElementById('typed-intro');
  if (target && typeof Typed !== 'undefined') {
    new Typed('#typed-intro', {
      strings: ["Thibaut G. Morillon"],
      typeSpeed: 60,
      showCursor: false
    });
  } else {
    console.warn('Typed or target element not found');
  }
});
