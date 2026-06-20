/**
 * Main Controller & Interface Bindings
 * Coordinates themes, menu toggles, PWA service worker, conversion screens, and typing modules.
 */
document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. Theme Management (Light / Dark Mode Toggle)
    // -------------------------------------------------------------
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            showToast(`Switched to ${newTheme.toUpperCase()} mode!`);
        });
    }

    // -------------------------------------------------------------
    // 2. Mobile Responsive Sidebar Toggle & Active Link Highlighting
    // -------------------------------------------------------------
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const sidebarClose = document.getElementById('sidebar-close');
    
    if (mobileToggle && sidebar && overlay) {
        const toggleSidebar = () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            mobileToggle.classList.toggle('open');
        };

        const closeSidebar = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            mobileToggle.classList.remove('open');
        };

        mobileToggle.addEventListener('click', toggleSidebar);
        overlay.addEventListener('click', closeSidebar);
        if (sidebarClose) {
            sidebarClose.addEventListener('click', closeSidebar);
        }

        // Close sidebar on Esc key press
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('active')) {
                closeSidebar();
            }
        });
    }

    // Active Link Highlighting
    const navLinks = document.querySelectorAll('.nav-link');
    if (navLinks.length > 0) {
        const currentPath = window.location.pathname;
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (currentPath === href || (href !== '/' && currentPath.startsWith(href))) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    // -------------------------------------------------------------
    // 3. Accordion / FAQ Handler
    // -------------------------------------------------------------
    const faqHeaders = document.querySelectorAll('.accordion-header');
    faqHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const body = item.querySelector('.accordion-body');
            const isActive = item.classList.contains('active');

            // Close all items
            document.querySelectorAll('.accordion-item').forEach(accItem => {
                accItem.classList.remove('active');
                accItem.querySelector('.accordion-body').style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                body.style.maxHeight = body.scrollHeight + 'px';
            }
        });
    });

    // -------------------------------------------------------------
    // 4. Toast Notification Manager
    // -------------------------------------------------------------
    function showToast(message) {
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'toast-msg';
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    // Bind globally
    window.showToast = showToast;

    // -------------------------------------------------------------
    // 5. Preeti to Unicode Page Bindings
    // -------------------------------------------------------------
    const preetiInput = document.getElementById('preeti-input');
    const unicodeOutput = document.getElementById('unicode-output');
    if (preetiInput && unicodeOutput) {
        // Live typing conversion
        preetiInput.addEventListener('input', () => {
            const legacyVal = preetiInput.value;
            const converted = NepaliConverter.preetiToUnicode(legacyVal);
            unicodeOutput.value = converted;
            updateStats(preetiInput, 'preeti-count');
            updateStats(unicodeOutput, 'unicode-count');
        });

        // Copy button
        bindCopyAction('preeti-copy', unicodeOutput, 'Unicode text copied!');
        // Clear button
        bindClearAction('preeti-clear', [preetiInput, unicodeOutput], ['preeti-count', 'unicode-count']);
    }

    // -------------------------------------------------------------
    // 6. Unicode to Preeti Page Bindings
    // -------------------------------------------------------------
    const unicodeInput = document.getElementById('unicode-input');
    const preetiOutput = document.getElementById('preeti-output');
    if (unicodeInput && preetiOutput) {
        // Live typing conversion
        unicodeInput.addEventListener('input', () => {
            const unicodeVal = unicodeInput.value;
            const converted = NepaliConverter.unicodeToPreeti(unicodeVal);
            preetiOutput.value = converted;
            updateStats(unicodeInput, 'unicode-inp-count');
            updateStats(preetiOutput, 'preeti-out-count');
        });

        // Copy button
        bindCopyAction('unicode-copy', preetiOutput, 'Preeti text copied!');
        // Clear button
        bindClearAction('unicode-clear', [unicodeInput, preetiOutput], ['unicode-inp-count', 'preeti-out-count']);
    }

    // -------------------------------------------------------------
    // 7. English to Nepali Typing & Key Interception Bindings
    // -------------------------------------------------------------
    const typingArea = document.getElementById('typing-area');
    const layoutSelectors = document.querySelectorAll('[data-layout]');
    
    if (typingArea) {
        const suggestionsContainer = document.getElementById('typing-suggestions');
        const statusBadge = document.getElementById('typing-status');
        const specialCharsSection = document.getElementById('special-chars-section');
        
        let currentInterception = null;
        let activeLayout = 'romanized';
        let suggestions = [];
        let activeSuggestionIndex = 0;
        let abortController = null;
        let lastFetchedWord = "";

        // Status badge online/offline detection
        const updateOnlineStatus = () => {
            if (!statusBadge) return;
            if (navigator.onLine) {
                statusBadge.textContent = "Online";
                statusBadge.classList.remove('offline');
            } else {
                statusBadge.textContent = "Offline";
                statusBadge.classList.add('offline');
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();

        const setKeyboardLayout = (layout) => {
            if (currentInterception) {
                currentInterception.disable();
            }
            
            activeLayout = layout;
            
            // If the layout is romanized, we use our custom live suggestions logic instead of keypress interceptor
            if (layout !== 'romanized') {
                currentInterception = Nepalify.intercept(typingArea, layout);
            } else {
                currentInterception = null;
            }
            
            // Set styles of buttons
            layoutSelectors.forEach(btn => {
                if (btn.getAttribute('data-layout') === layout) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Set placeholder contextually & update visibility of auxiliary panels
            if (layout === 'traditional') {
                typingArea.placeholder = "पारम्परिक प्रीति लेआउटमा टाइप गर्नुहोस् (जैसे: s = क, t = त)...";
                typingArea.className = "editor-textarea nepali-font";
                if (statusBadge) statusBadge.style.display = 'none';
                if (suggestionsContainer) {
                    suggestionsContainer.style.display = 'none';
                    suggestionsContainer.innerHTML = "";
                }
                if (specialCharsSection) specialCharsSection.style.display = 'block';
            } else if (layout === 'romanized') {
                typingArea.placeholder = "अंग्रेजीमा टाइप गर्नुहोस् (जैसे: namaste = नमस्ते, mero naam = मेरो नाम)...";
                typingArea.className = "editor-textarea nepali-font";
                if (statusBadge) statusBadge.style.display = 'inline-block';
                if (specialCharsSection) specialCharsSection.style.display = 'block';
                // Trigger an initial check if there is text in the box
                setTimeout(handleInputOrCursor, 50);
            } else if (layout === 'romanize') {
                typingArea.placeholder = "यहाँ नेपाली युनिकोड पेस्ट गर्नुहोस् वा टाइप गर्नुहोस् (Devanagari to Roman English)...";
                typingArea.className = "editor-textarea";
                if (statusBadge) statusBadge.style.display = 'none';
                if (suggestionsContainer) {
                    suggestionsContainer.style.display = 'none';
                    suggestionsContainer.innerHTML = "";
                }
                if (specialCharsSection) specialCharsSection.style.display = 'none';
            } else {
                typingArea.placeholder = "Type standard English here...";
                typingArea.className = "editor-textarea";
                if (statusBadge) statusBadge.style.display = 'none';
                if (suggestionsContainer) {
                    suggestionsContainer.style.display = 'none';
                    suggestionsContainer.innerHTML = "";
                }
                if (specialCharsSection) specialCharsSection.style.display = 'none';
            }

            const layoutNames = {
                'romanized': 'English to Nepali',
                'traditional': 'Traditional',
                'romanize': 'Nepali to English',
                'english': 'English'
            };
            showToast(`Switched layout to ${layoutNames[layout] || layout}`);
        };

        // Attach listeners to selectors
        layoutSelectors.forEach(btn => {
            btn.addEventListener('click', () => {
                setKeyboardLayout(btn.getAttribute('data-layout'));
            });
        });

        // -------------------------------------------------------------
        // Suggestions Autocomplete Logic
        // -------------------------------------------------------------
        function getActiveWordInfo() {
            const value = typingArea.value;
            const selStart = typingArea.selectionStart;
            const selEnd = typingArea.selectionEnd;
            
            if (selStart !== selEnd) return null;
            
            const textBefore = value.substring(0, selStart);
            const match = textBefore.match(/[a-zA-Z]+$/);
            if (!match) return null;
            
            const word = match[0];
            const startPos = selStart - word.length;
            
            return {
                word: word,
                start: startPos,
                end: selStart
            };
        }

        function fetchSuggestions(word, callback) {
            if (abortController) {
                abortController.abort();
            }
            
            if (!navigator.onLine) {
                const localVal = Nepalify.transliterateWord(word);
                callback([localVal]);
                return;
            }
            
            abortController = new AbortController();
            const signal = abortController.signal;
            const url = `https://inputtools.google.com/request?itc=ne-t-i0-und&num=6&cp=0&cs=1&ie=utf-8&oe=utf-8&app=nepalitools&text=${encodeURIComponent(word)}`;
            
            fetch(url, { signal })
                .then(response => response.json())
                .then(data => {
                    try {
                        if (data && data[1] && data[1][0] && data[1][0][2]) {
                            let results = data[1][0][2];
                            results = [...new Set(results)];
                            callback(results);
                        } else {
                            callback([Nepalify.transliterateWord(word)]);
                        }
                    } catch (e) {
                        callback([Nepalify.transliterateWord(word)]);
                    }
                })
                .catch(err => {
                    if (err.name !== 'AbortError') {
                        callback([Nepalify.transliterateWord(word)]);
                    }
                });
        }

        function renderSuggestions(word, list) {
            if (!suggestionsContainer) return;
            
            suggestions = list;
            activeSuggestionIndex = 0;
            
            if (list.length === 0) {
                suggestionsContainer.style.display = 'none';
                suggestionsContainer.innerHTML = "";
                return;
            }
            
            suggestionsContainer.innerHTML = "";
            list.forEach((sug, index) => {
                const chip = document.createElement('div');
                chip.className = 'suggestion-chip';
                if (index === 0) {
                    chip.classList.add('active');
                }
                
                const numSpan = document.createElement('span');
                numSpan.className = 'chip-index';
                numSpan.textContent = index + 1;
                
                chip.appendChild(numSpan);
                chip.appendChild(document.createTextNode(sug));
                
                chip.addEventListener('click', (e) => {
                    e.preventDefault();
                    commitSuggestion(word, sug, true);
                    typingArea.focus();
                });
                
                suggestionsContainer.appendChild(chip);
            });
            
            suggestionsContainer.style.display = 'flex';
        }

        function commitSuggestion(englishWord, nepaliWord, appendSpace = true) {
            const info = getActiveWordInfo();
            if (!info) return;
            
            const start = info.start;
            const end = info.end;
            const val = typingArea.value;
            
            const before = val.substring(0, start);
            const after = val.substring(end);
            
            const inserted = nepaliWord + (appendSpace ? " " : "");
            typingArea.value = before + inserted + after;
            
            const newCursorPos = start + inserted.length;
            typingArea.setSelectionRange(newCursorPos, newCursorPos);
            
            if (suggestionsContainer) {
                suggestionsContainer.style.display = 'none';
                suggestionsContainer.innerHTML = "";
            }
            suggestions = [];
            lastFetchedWord = "";
            
            typingArea.dispatchEvent(new Event('input', { bubbles: true }));
        }

        function updateHighlightedSuggestion() {
            if (!suggestionsContainer) return;
            const chips = suggestionsContainer.querySelectorAll('.suggestion-chip');
            chips.forEach((chip, idx) => {
                if (idx === activeSuggestionIndex) {
                    chip.classList.add('active');
                    chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                } else {
                    chip.classList.remove('active');
                }
            });
        }

        const handleInputOrCursor = () => {
            if (activeLayout !== 'romanized') return;
            
            const info = getActiveWordInfo();
            if (!info) {
                if (suggestionsContainer) {
                    suggestionsContainer.style.display = 'none';
                    suggestionsContainer.innerHTML = "";
                }
                suggestions = [];
                lastFetchedWord = "";
                return;
            }
            
            const currentWord = info.word;
            if (currentWord === lastFetchedWord) return;
            
            lastFetchedWord = currentWord;
            fetchSuggestions(currentWord, (list) => {
                renderSuggestions(currentWord, list);
            });
        };

        // Textarea typing/movement bindings
        typingArea.addEventListener('input', handleInputOrCursor);
        typingArea.addEventListener('keyup', (e) => {
            if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') {
                handleInputOrCursor();
            }
        });
        typingArea.addEventListener('click', handleInputOrCursor);

        // Key interception for autocomplete controls
        typingArea.addEventListener('keydown', (e) => {
            if (activeLayout !== 'romanized') return;
            
            const suggestionsVisible = suggestionsContainer && suggestionsContainer.style.display !== 'none' && suggestions.length > 0;
            
            if (!suggestionsVisible) {
                // If suggestions are loading or we hit space/enter, we can fall back to local rule-based mapping instantly
                if (e.key === ' ' || e.key === 'Enter') {
                    const info = getActiveWordInfo();
                    if (info) {
                        e.preventDefault();
                        const localVal = Nepalify.transliterateWord(info.word);
                        commitSuggestion(info.word, localVal, e.key === ' ');
                        if (e.key === 'Enter') {
                            const pos = typingArea.selectionStart;
                            typingArea.value = typingArea.value.substring(0, pos) + "\n" + typingArea.value.substring(pos);
                            typingArea.setSelectionRange(pos + 1, pos + 1);
                            typingArea.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                }
                return;
            }
            
            // Handle active suggestions navigation/selection
            if (e.key === ' ') {
                e.preventDefault();
                const selectedVal = suggestions[activeSuggestionIndex];
                commitSuggestion(lastFetchedWord, selectedVal, true);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selectedVal = suggestions[activeSuggestionIndex];
                commitSuggestion(lastFetchedWord, selectedVal, false);
                // Append a newline
                const pos = typingArea.selectionStart;
                typingArea.value = typingArea.value.substring(0, pos) + "\n" + typingArea.value.substring(pos);
                typingArea.setSelectionRange(pos + 1, pos + 1);
                typingArea.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (e.key === 'Escape') {
                e.preventDefault();
                suggestionsContainer.style.display = 'none';
                suggestions = [];
                lastFetchedWord = "";
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'Tab') {
                e.preventDefault();
                activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
                updateHighlightedSuggestion();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                e.preventDefault();
                activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
                updateHighlightedSuggestion();
            } else if (e.key >= '1' && e.key <= '6') {
                const index = parseInt(e.key) - 1;
                if (index < suggestions.length) {
                    e.preventDefault();
                    commitSuggestion(lastFetchedWord, suggestions[index], true);
                }
            }
        });

        // -------------------------------------------------------------
        // Special Characters Grid Click to Insert
        // -------------------------------------------------------------
        const specialChars = document.querySelectorAll('.special-chars-grid span');
        specialChars.forEach(span => {
            span.addEventListener('click', () => {
                const char = span.getAttribute('data-char');
                if (!char) return;
                
                const start = typingArea.selectionStart;
                const end = typingArea.selectionEnd;
                const val = typingArea.value;
                
                typingArea.value = val.substring(0, start) + char + val.substring(end);
                const newPos = start + char.length;
                typingArea.setSelectionRange(newPos, newPos);
                
                typingArea.focus();
                typingArea.dispatchEvent(new Event('input', { bubbles: true }));
            });
        });

        // Initialize default layout
        setKeyboardLayout('romanized');
        
        // Character & Word Counter
        typingArea.addEventListener('input', () => {
            updateStats(typingArea, 'typing-char-count');
            
            const text = typingArea.value.trim();
            const words = text === "" ? 0 : text.split(/\s+/).length;
            const wordCounter = document.getElementById('typing-word-count');
            if (wordCounter) {
                wordCounter.textContent = `${words} words`;
            }
        });

        // Copy & Clear
        bindCopyAction('typing-copy', typingArea, 'Typed text copied!');
        bindClearAction('typing-clear', [typingArea], ['typing-char-count']);
    }



    // -------------------------------------------------------------
    // 8. Nepali Typing Practice Module (Typeshala Mode)
    // -------------------------------------------------------------
    const practiceDisplay = document.getElementById('practice-display');
    const practiceInput = document.getElementById('practice-input');
    if (practiceDisplay && practiceInput) {
        // Typing practice lessons (Unicode Nepali sentences)
        const lessons = [
            "नेपाल एउटा सुन्दर र शान्त देश हो।",
            "हामी नेपाली हौँ र हामीलाई हाम्रो भाषा मन पर्छ।",
            "प्रीति फन्टबाट युनिकोडमा रूपान्तरण गर्न निकै सजिलो छ।",
            "सञ्चार प्रविधिले गर्दा संसार एउटा सानो गाउँ जस्तो भएको छ।",
            "विद्यार्थीहरूले दैनिक रूपमा नेपाली टाइपिङ अभ्यास गर्नुपर्दछ।",
            "मलाई मेरो मातृभूमि नेपाल र नेपाली संस्कृतिको गर्व छ।"
        ];

        let lessonIndex = 0;
        let originalText = lessons[lessonIndex];
        let startTime = null;
        let totalKeysPressed = 0;
        let errors = 0;
        let timerInterval = null;

        // Initialize Romanized keyboard layout interception on the practice textbox
        Nepalify.intercept(practiceInput, 'romanized');

        const resetPractice = () => {
            originalText = lessons[lessonIndex];
            practiceInput.value = "";
            startTime = null;
            totalKeysPressed = 0;
            errors = 0;
            if (timerInterval) clearInterval(timerInterval);
            
            document.getElementById('practice-wpm').textContent = "0";
            document.getElementById('practice-accuracy').textContent = "100%";
            document.getElementById('practice-timer').textContent = "0s";
            
            renderDisplay();
        };

        const renderDisplay = () => {
            const inputVal = practiceInput.value;
            let displayHTML = "";
            
            for (let i = 0; i < originalText.length; i++) {
                const char = originalText[i];
                if (i < inputVal.length) {
                    if (inputVal[i] === char) {
                        displayHTML += `<span class="correct">${char}</span>`;
                    } else {
                        displayHTML += `<span class="incorrect">${char}</span>`;
                    }
                } else if (i === inputVal.length) {
                    displayHTML += `<span class="current">${char}</span>`;
                } else {
                    displayHTML += `<span>${char}</span>`;
                }
            }
            
            practiceDisplay.innerHTML = displayHTML;
        };

        practiceInput.addEventListener('input', () => {
            if (!startTime) {
                startTime = new Date();
                timerInterval = setInterval(updateStats, 1000);
            }

            totalKeysPressed++;
            const inputVal = practiceInput.value;

            // Check errors
            errors = 0;
            for (let i = 0; i < inputVal.length; i++) {
                if (inputVal[i] !== originalText[i]) {
                    errors++;
                }
            }

            renderDisplay();

            // Check if lesson is complete
            if (inputVal === originalText) {
                clearInterval(timerInterval);
                showToast("Lesson Complete! Excellent job!");
                // Next lesson
                lessonIndex = (lessonIndex + 1) % lessons.length;
                setTimeout(resetPractice, 1500);
            }
        });

        const updateStats = () => {
            if (!startTime) return;
            
            const timeElapsed = (new Date() - startTime) / 1000; // seconds
            const inputLength = practiceInput.value.length;
            
            // Standard Word calculation (5 characters = 1 word)
            const wpm = timeElapsed > 0 ? Math.round((inputLength / 5) / (timeElapsed / 60)) : 0;
            
            // Accuracy calculation
            const accuracy = totalKeysPressed > 0 ? Math.round(((totalKeysPressed - errors) / totalKeysPressed) * 100) : 100;

            document.getElementById('practice-wpm').textContent = wpm;
            document.getElementById('practice-accuracy').textContent = `${Math.max(0, accuracy)}%`;
            document.getElementById('practice-timer').textContent = `${Math.round(timeElapsed)}s`;
        };

        // Reset lessons selector
        const lessonSelect = document.getElementById('lesson-select');
        if (lessonSelect) {
            lessonSelect.addEventListener('change', (e) => {
                lessonIndex = parseInt(e.target.value);
                resetPractice();
            });
        }

        // Initialize Practice screen
        resetPractice();
    }

    // -------------------------------------------------------------
    // Helper Functions for Buttons and Inputs
    // -------------------------------------------------------------
    function updateStats(textarea, statId) {
        const statEl = document.getElementById(statId);
        if (statEl) {
            const count = textarea.value.length;
            statEl.textContent = `${count} characters`;
        }
    }

    function bindCopyAction(btnId, targetTextarea, toastMsg) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                if (targetTextarea.value === "") {
                    showToast("Nothing to copy!");
                    return;
                }
                targetTextarea.select();
                navigator.clipboard.writeText(targetTextarea.value)
                    .then(() => showToast(toastMsg))
                    .catch(() => showToast("Failed to copy!"));
            });
        }
    }

    function bindClearAction(btnId, textareas, statIds) {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                textareas.forEach((t, i) => {
                    t.value = "";
                    t.dispatchEvent(new Event('input', { bubbles: true }));
                    const statId = statIds[i];
                    if (statId) {
                        const statEl = document.getElementById(statId);
                        if (statEl) {
                            statEl.textContent = "0 characters";
                        }
                    }
                });
                showToast("Cleared!");
            });
        }
    }

    // -------------------------------------------------------------
    // 9. PWA Install Banner Hooks
    // -------------------------------------------------------------
    let deferredPrompt;
    const pwaInstallContainer = document.getElementById('pwa-install-container');
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    const sidebarInstallContainer = document.getElementById('sidebar-install-container');
    const sidebarInstallBtn = document.getElementById('sidebar-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (pwaInstallContainer) {
            pwaInstallContainer.style.display = 'block';
        }
        if (sidebarInstallContainer) {
            sidebarInstallContainer.style.display = 'block';
        }
    });

    const triggerInstall = () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                if (pwaInstallContainer) pwaInstallContainer.style.display = 'none';
                if (sidebarInstallContainer) sidebarInstallContainer.style.display = 'none';
            }
            deferredPrompt = null;
        });
    };

    if (pwaInstallBtn) {
        pwaInstallBtn.addEventListener('click', triggerInstall);
    }
    if (sidebarInstallBtn) {
        sidebarInstallBtn.addEventListener('click', triggerInstall);
    }

    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        if (pwaInstallContainer) pwaInstallContainer.style.display = 'none';
        if (sidebarInstallContainer) sidebarInstallContainer.style.display = 'none';
        showToast("App installed successfully! Enjoy offline support.");
    });
});
