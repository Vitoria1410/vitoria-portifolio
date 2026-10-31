'use strict';
(() => {
  const status = document.querySelector('#contact-status');
  document.querySelectorAll('.copy-contact').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        status.textContent = button.dataset.copy.includes('@') ? 'E-mail copiado!' : 'Telefone copiado!';
      } catch {
        // Keep copying possible in local previews or browsers without clipboard permission.
        const value = button.closest('.contact-detail').querySelector('.contact-value');
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(value);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        status.textContent = 'Selecione e copie o contato acima. No computador, use Ctrl+C ou ⌘C.';
      }
    });
  });
})();
