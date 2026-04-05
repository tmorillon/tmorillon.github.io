  document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('darkModeToggle');
    const body = document.body;

    // Load saved theme from localStorage (default: dark)
    if (localStorage.getItem('theme') !== 'light') {
      body.classList.add('dark');
    }

    toggleBtn.addEventListener('click', () => {
      body.classList.toggle('dark');
      // Save theme preference
      if (body.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
      } else {
        localStorage.setItem('theme', 'light');
      }
    });
  });
