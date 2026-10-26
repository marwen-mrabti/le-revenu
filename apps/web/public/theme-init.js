// Applies the stored theme (localStorage "theme": light | dark | system) before the first paint.
// Kept outside React on purpose: scripts rendered by React are not executed on client-rendered pages.
(() => {
  try {
    const choice = localStorage.getItem('theme');
    const dark =
      choice === 'dark' ||
      ((!choice || choice === 'system') && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch {
    /* storage blocked: the OS setting wins through the provider */
  }
})();
