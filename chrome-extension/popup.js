document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  const converterMode = document.getElementById('converter-mode');
  const converterInput = document.getElementById('converter-input');
  const converterOutput = document.getElementById('converter-output');
  const btnConvert = document.getElementById('btn-convert');
  const btnClearConv = document.getElementById('btn-clear-conv');
  const btnCopyConv = document.getElementById('btn-copy-conv');
  const lblInput = document.getElementById('lbl-input');
  const lblOutput = document.getElementById('lbl-output');
  
  const converterInputStats = document.getElementById('converter-input-stats');
  const converterOutputStats = document.getElementById('converter-output-stats');

  const typingLayout = document.getElementById('typing-layout');
  const typingInput = document.getElementById('typing-input');
  const typingStats = document.getElementById('typing-stats');
  const btnClearType = document.getElementById('btn-clear-type');
  const btnCopyType = document.getElementById('btn-copy-type');
  const typingIndicator = document.getElementById('typing-indicator');

  let typingController = null;

  // --- Tab Navigation ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      // Update active tab buttons
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active tab panes
      tabPanes.forEach(pane => {
        if (pane.id === targetTab) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });

      // Initialize or toggle typing bindings when switching tabs
      if (targetTab === 'typing-tab') {
        setupTyping();
        typingInput.focus();
      } else {
        disableTyping();
      }
    });
  });

  // --- Font Converter Logic ---
  function performConversion() {
    const inputVal = converterInput.value;
    const mode = converterMode.value;

    if (!inputVal.trim()) {
      converterOutput.value = '';
      updateStats();
      return;
    }

    try {
      if (mode === 'preeti2unicode') {
        converterOutput.value = NepaliConverter.preetiToUnicode(inputVal);
      } else {
        converterOutput.value = NepaliConverter.unicodeToPreeti(inputVal);
      }
    } catch (err) {
      console.error('Conversion error:', err);
      converterOutput.value = 'Error during conversion: ' + err.message;
    }
    updateStats();
  }

  function updateStats() {
    const inputLen = converterInput.value.length;
    const outputLen = converterOutput.value.length;

    converterInputStats.textContent = `${inputLen} char${inputLen !== 1 ? 's' : ''}`;
    converterOutputStats.textContent = `${outputLen} char${outputLen !== 1 ? 's' : ''}`;
  }

  // Handle label swapping when mode changes
  converterMode.addEventListener('change', () => {
    const mode = converterMode.value;
    if (mode === 'preeti2unicode') {
      lblInput.textContent = 'Input Text (Preeti)';
      lblOutput.textContent = 'Converted Output (Unicode)';
      converterInput.placeholder = 'Type or paste Preeti text here...';
    } else {
      lblInput.textContent = 'Input Text (Unicode)';
      lblOutput.textContent = 'Converted Output (Preeti)';
      converterInput.placeholder = 'Type or paste Unicode text here...';
    }
    // Re-convert on mode change
    performConversion();
  });

  // Live conversion on input
  converterInput.addEventListener('input', performConversion);
  btnConvert.addEventListener('click', performConversion);

  // Clear text
  btnClearConv.addEventListener('click', () => {
    converterInput.value = '';
    converterOutput.value = '';
    updateStats();
    converterInput.focus();
  });

  // Copy to clipboard helper
  function copyTextToClipboard(text, buttonElement) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const originalHTML = buttonElement.innerHTML;
      buttonElement.innerHTML = '<span class="btn-icon">✓</span> Copied!';
      buttonElement.style.borderColor = 'var(--accent-hover)';
      buttonElement.style.color = 'var(--accent-hover)';

      setTimeout(() => {
        buttonElement.innerHTML = originalHTML;
        buttonElement.style.borderColor = '';
        buttonElement.style.color = '';
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  btnCopyConv.addEventListener('click', () => {
    copyTextToClipboard(converterOutput.value, btnCopyConv);
  });

  // --- Nepali Typing Logic ---
  function setupTyping() {
    if (typingController) {
      typingController.disable();
    }

    const layout = typingLayout.value;
    typingController = Nepalify.intercept(typingInput, layout);
    
    // Update indicator UI
    if (layout === 'romanized') {
      typingIndicator.textContent = 'Phonetic (Romanized) Active';
      typingIndicator.style.backgroundColor = 'rgba(179, 0, 45, 0.15)';
      typingIndicator.style.color = 'var(--accent-hover)';
      typingIndicator.style.borderColor = 'rgba(179, 0, 45, 0.3)';
    } else {
      typingIndicator.textContent = 'Traditional (Preeti Keys) Active';
      typingIndicator.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
      typingIndicator.style.color = '#10b981';
      typingIndicator.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    }

    updateTypingStats();
  }

  function disableTyping() {
    if (typingController) {
      typingController.disable();
      typingController = null;
    }
  }

  function updateTypingStats() {
    const text = typingInput.value;
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    typingStats.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''} | ${charCount} char${charCount !== 1 ? 's' : ''}`;
  }

  typingLayout.addEventListener('change', setupTyping);
  typingInput.addEventListener('input', updateTypingStats);

  btnClearType.addEventListener('click', () => {
    typingInput.value = '';
    updateTypingStats();
    typingInput.focus();
  });

  btnCopyType.addEventListener('click', () => {
    copyTextToClipboard(typingInput.value, btnCopyType);
  });

  // Initialize page stats on load
  updateStats();
});
