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

        // Check for transferred text from sessionStorage
        try {
            const transferText = sessionStorage.getItem('nepalitools_transfer_text');
            if (transferText) {
                unicodeInput.value = transferText;
                unicodeInput.dispatchEvent(new Event('input', { bubbles: true }));
                sessionStorage.removeItem('nepalitools_transfer_text');
            }
        } catch (e) {
            console.error("Failed to read/clear sessionStorage:", e);
        }
    }

    // -------------------------------------------------------------
    // 7. English to Nepali Typing & Key Interception Bindings
    // -------------------------------------------------------------
    const typingArea = document.getElementById('typing-area');
    const layoutSelectors = document.querySelectorAll('[data-layout]');
    
    if (typingArea) {
        const suggestionsContainer = document.getElementById('typing-suggestions');
        const specialCharsSection = document.getElementById('special-chars-section');
        
        let currentInterception = null;
        let activeLayout = 'romanized';
        let translitMode = 'ne'; // 'ne' for Nepali, 'en' for English ABC
        let suggestions = [];
        let activeSuggestionIndex = 0;
        let abortController = null;
        let lastFetchedWord = "";

        // Status badge online/offline detection
        const updateOnlineStatus = () => {
            const statusDot = document.getElementById('status-dot');
            const statusText = document.getElementById('typing-status-text');
            if (!statusDot && !statusText) return;

            if (navigator.onLine) {
                if (statusDot) {
                    statusDot.classList.remove('offline');
                    statusDot.style.backgroundColor = '#2e7d32';
                }
                if (statusText) statusText.textContent = "Online";
            } else {
                if (statusDot) {
                    statusDot.classList.add('offline');
                    statusDot.style.backgroundColor = '#c62828';
                }
                if (statusText) statusText.textContent = "Offline";
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();

        // Language Switch Toggle Methods (नेपाली / ABC)
        const setTranslitMode = (mode) => {
            translitMode = mode;
            const btnNe = document.getElementById('lang-toggle-ne');
            const btnEn = document.getElementById('lang-toggle-en');

            if (mode === 'ne') {
                if (btnNe) btnNe.classList.add('active');
                if (btnEn) btnEn.classList.remove('active');
                typingArea.placeholder = "टाइपिङ सुरु गर्नुहोस् (k = क, a = ा, m = म = काम)...";
                showToast("Switched input mode to Nepali (नेपाली)");
                handleInputOrCursor();
            } else {
                if (btnNe) btnNe.classList.remove('active');
                if (btnEn) btnEn.classList.add('active');
                typingArea.placeholder = "Type in English (transliteration off)...";
                if (suggestionsContainer) {
                    suggestionsContainer.style.display = 'none';
                    suggestionsContainer.innerHTML = "";
                }
                suggestions = [];
                lastFetchedWord = "";
                showToast("Switched input mode to English (ABC)");
            }
        };

        const toggleTranslitMode = () => {
            const newMode = translitMode === 'ne' ? 'en' : 'ne';
            setTranslitMode(newMode);
        };

        const btnNe = document.getElementById('lang-toggle-ne');
        const btnEn = document.getElementById('lang-toggle-en');
        if (btnNe) {
            btnNe.addEventListener('click', (e) => {
                e.preventDefault();
                setTranslitMode('ne');
            });
        }
        if (btnEn) {
            btnEn.addEventListener('click', (e) => {
                e.preventDefault();
                setTranslitMode('en');
            });
        }

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

            const subHeader = document.getElementById('typing-sub-header');
            const shortcutsGuide = document.getElementById('typing-shortcuts-guide');

            // Set placeholder contextually & update visibility of auxiliary panels
            if (layout === 'traditional') {
                typingArea.placeholder = "पारम्परिक प्रीति लेआउटमा टाइप गर्नुहोस् (जैसे: s = क, t = त)...";
                typingArea.className = "editor-textarea nepali-font";
                if (subHeader) subHeader.style.display = 'none';
                if (suggestionsContainer) {
                    suggestionsContainer.style.display = 'none';
                    suggestionsContainer.innerHTML = "";
                }
                if (specialCharsSection) specialCharsSection.style.display = 'block';
                if (shortcutsGuide) shortcutsGuide.style.display = 'none';
            } else if (layout === 'romanized') {
                if (translitMode === 'ne') {
                    typingArea.placeholder = "अंग्रेजीमा टाइप गर्नुहोस् (जैसे: namaste = नमस्ते, mero naam = मेरो नाम)...";
                } else {
                    typingArea.placeholder = "Type in English (transliteration off)...";
                }
                typingArea.className = "editor-textarea nepali-font";
                if (subHeader) subHeader.style.display = 'flex';
                if (specialCharsSection) specialCharsSection.style.display = 'block';
                if (shortcutsGuide) shortcutsGuide.style.display = 'flex';
                setTimeout(handleInputOrCursor, 50);
            } else if (layout === 'romanize') {
                typingArea.placeholder = "यहाँ नेपाली युनिकोड पेस्ट गर्नुहोस् वा टाइप गर्नुहोस् (Devanagari to Roman English)...";
                typingArea.className = "editor-textarea";
                if (subHeader) subHeader.style.display = 'none';
                if (suggestionsContainer) {
                    suggestionsContainer.style.display = 'none';
                    suggestionsContainer.innerHTML = "";
                }
                if (specialCharsSection) specialCharsSection.style.display = 'none';
                if (shortcutsGuide) shortcutsGuide.style.display = 'none';
            } else {
                typingArea.placeholder = "Type standard English here...";
                typingArea.className = "editor-textarea";
                if (subHeader) subHeader.style.display = 'none';
                if (suggestionsContainer) {
                    suggestionsContainer.style.display = 'none';
                    suggestionsContainer.innerHTML = "";
                }
                if (specialCharsSection) specialCharsSection.style.display = 'none';
                if (shortcutsGuide) shortcutsGuide.style.display = 'none';
            }

            const layoutNames = {
                'romanized': 'English to Nepali',
                'traditional': 'Traditional',
                'romanize': 'Nepali to English',
                'english': 'English'
            };
            showToast(`Switched layout to ${layoutNames[layout] || layout}`);
            updateStatsDisplay();
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
            if (activeLayout !== 'romanized' || translitMode !== 'ne') return;
            
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
            // Global toggle Ctrl+G
            if (e.ctrlKey && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                toggleTranslitMode();
                return;
            }

            if (activeLayout !== 'romanized') return;
            if (translitMode !== 'ne') return;
            
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

        // Dynamic Stats Display Formatting
        const updateStatsDisplay = () => {
            const statsDisplay = document.getElementById('typing-stats-display');
            const value = typingArea.value;
            const charCount = value.length;
            const textTrimmed = value.trim();
            const wordCount = textTrimmed === "" ? 0 : textTrimmed.split(/\s+/).length;

            if (statsDisplay) {
                const isNepaliLayout = (activeLayout === 'romanized' || activeLayout === 'traditional');
                if (isNepaliLayout) {
                    const neDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
                    const toNeNum = (num) => num.toString().split('').map(d => neDigits[d] || d).join('');
                    statsDisplay.textContent = `${toNeNum(wordCount)} शब्द • ${toNeNum(charCount)} अक्षर`;
                } else {
                    statsDisplay.textContent = `${wordCount} words • ${charCount} characters`;
                }
            }

            // Older selectors compatibility
            const oldCharCount = document.getElementById('typing-char-count');
            if (oldCharCount) oldCharCount.textContent = `${charCount} characters`;
            const oldWordCount = document.getElementById('typing-word-count');
            if (oldWordCount) oldWordCount.textContent = `${wordCount} words`;
        };

        // Initialize default layout
        setKeyboardLayout('romanized');

        // Autosave Restore
        try {
            const savedText = localStorage.getItem('nepalitools_typed_text');
            if (savedText) {
                typingArea.value = savedText;
                setTimeout(() => {
                    typingArea.dispatchEvent(new Event('input', { bubbles: true }));
                }, 100);
            }
        } catch (e) {
            console.error("Autosave restore failed:", e);
        }
        
        // Character & Word Counter + Storage Save
        typingArea.addEventListener('input', () => {
            updateStatsDisplay();
            try {
                localStorage.setItem('nepalitools_typed_text', typingArea.value);
            } catch (e) {
                console.error("Autosave store failed:", e);
            }
        });

        // Copy & Clear
        bindCopyAction('typing-copy', typingArea, 'Typed text copied!');
        bindClearAction('typing-clear', [typingArea], []);
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
    // 8. Nepali Voice Typing Page Bindings
    // -------------------------------------------------------------
    const voiceArea = document.getElementById('voice-typing-area');
    if (voiceArea) {
        const micToggleBtn = document.getElementById('mic-toggle-btn');
        const punctuationBar = document.getElementById('punctuation-bar');
        const voiceUndoBtn = document.getElementById('voice-undo');
        const transferToPreetiBtn = document.getElementById('transfer-to-preeti');
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('typing-status-text');
        const statsDisplay = document.getElementById('typing-stats-display');

        let isListening = false;
        let recognition = null;
        let voiceHistory = [];
        let silenceTimer = null;

        const updateStatsDisplay = () => {
            if (!statsDisplay) return;
            const text = voiceArea.value;
            const charCount = text.length;
            const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
            statsDisplay.textContent = `${wordCount} शब्द • ${charCount} अक्षर`;
        };

        const updateStatusBadge = (listening) => {
            if (!statusDot || !statusText) return;
            if (listening) {
                statusText.textContent = "सुन्दैछ...";
                statusDot.style.backgroundColor = "#c62828";
                statusDot.classList.add('listening');
            } else {
                statusText.textContent = "तयार";
                statusDot.style.backgroundColor = "#2e7d32";
                statusDot.classList.remove('listening');
            }
        };

        const startListening = () => {
            if (recognition && !isListening) {
                isListening = true;
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Error starting speech recognition:", e);
                }
            }
        };

        const stopListening = () => {
            if (recognition && isListening) {
                isListening = false;
                try {
                    recognition.stop();
                } catch (e) {
                    console.error("Error stopping speech recognition:", e);
                }
                if (micToggleBtn) {
                    micToggleBtn.classList.remove('listening');
                }
                resetSilenceTimer();
                updateStatusBadge(false);
            }
        };

        const toggleVoiceTyping = () => {
            if (!recognition) {
                showToast("Voice typing is not supported in this browser.");
                return;
            }
            if (isListening) {
                stopListening();
            } else {
                startListening();
            }
        };

        const resetSilenceTimer = () => {
            if (silenceTimer) {
                clearTimeout(silenceTimer);
                silenceTimer = null;
            }
        };

        const startSilenceTimer = () => {
            resetSilenceTimer();
            silenceTimer = setTimeout(() => {
                showToast("Voice typing stopped after 1 minute of silence.");
                stopListening();
            }, 60000); // 1 minute of silence
        };

        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'ne-NP';

            recognition.onstart = () => {
                isListening = true;
                if (micToggleBtn) {
                    micToggleBtn.classList.add('listening');
                }
                updateStatusBadge(true);
                startSilenceTimer();
            };

            recognition.onend = () => {
                if (isListening) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.error("Failed to restart speech recognition:", e);
                    }
                } else {
                    if (micToggleBtn) {
                        micToggleBtn.classList.remove('listening');
                    }
                    resetSilenceTimer();
                    updateStatusBadge(false);
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                if (event.error === 'not-allowed') {
                    showToast("Microphone permission denied.");
                    stopListening();
                }
            };

            recognition.onresult = (event) => {
                resetSilenceTimer();
                startSilenceTimer();

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        let text = event.results[i][0].transcript;
                        text = replaceVoiceCommands(text);
                        if (text.trim()) {
                            insertVoiceText(text);
                            voiceHistory.push(text);
                        }
                    }
                }
            };
        } else {
            if (micToggleBtn) {
                micToggleBtn.title = "Voice Typing not supported in this browser";
            }
        }

        const replaceVoiceCommands = (text) => {
            let newText = text;
            newText = newText.replace(/पूर्ण विराम/g, '।');
            newText = newText.replace(/नयाँ लाइन/g, '\n');
            newText = newText.replace(/प्रश्न चिन्ह/g, '?');
            newText = newText.replace(/अल्प विराम/g, ',');
            newText = newText.replace(/उद्गार चिन्ह/g, '!');
            return newText;
        };

        const insertVoiceText = (text) => {
            const startPos = voiceArea.selectionStart;
            const endPos = voiceArea.selectionEnd;
            const oldValue = voiceArea.value;

            let prefix = "";
            if (startPos > 0 && !oldValue.substring(startPos - 1, startPos).match(/[\s\n।?,!॥]/) && !text.match(/^[\s\n।?,!॥]/)) {
                prefix = " ";
            }

            const textToInsert = prefix + text;
            voiceArea.value = oldValue.substring(0, startPos) + textToInsert + oldValue.substring(endPos);

            const newCursorPos = startPos + textToInsert.length;
            voiceArea.selectionStart = newCursorPos;
            voiceArea.selectionEnd = newCursorPos;

            voiceArea.dispatchEvent(new Event('input', { bubbles: true }));
        };

        const undoVoice = () => {
            if (voiceHistory.length === 0) {
                showToast("Nothing to undo!");
                return;
            }

            const lastText = voiceHistory.pop();
            const currentValue = voiceArea.value;

            const idx = currentValue.lastIndexOf(lastText);
            if (idx !== -1) {
                voiceArea.value = currentValue.substring(0, idx) + currentValue.substring(idx + lastText.length);
                voiceArea.selectionStart = idx;
                voiceArea.selectionEnd = idx;
                voiceArea.dispatchEvent(new Event('input', { bubbles: true }));
                showToast("Last voice input undone.");
            } else {
                showToast("Could not find the last spoken text to undo.");
            }
        };

        // Autosave / restore support
        try {
            const savedText = localStorage.getItem('nepalitools_voice_typed_text');
            if (savedText) {
                voiceArea.value = savedText;
                updateStatsDisplay();
            }
        } catch (e) {
            console.error("Autosave restore failed:", e);
        }

        voiceArea.addEventListener('input', () => {
            updateStatsDisplay();
            try {
                localStorage.setItem('nepalitools_voice_typed_text', voiceArea.value);
            } catch (e) {
                console.error("Autosave store failed:", e);
            }
        });

        // Bind buttons
        if (micToggleBtn) {
            micToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleVoiceTyping();
            });
        }

        if (punctuationBar) {
            punctuationBar.addEventListener('click', (e) => {
                const btn = e.target.closest('.punc-btn');
                if (btn) {
                    e.preventDefault();
                    let val = btn.getAttribute('data-val');
                    if (val === '\\n') {
                        val = '\n';
                    }
                    insertVoiceText(val);
                    voiceArea.focus();
                }
            });
        }

        if (voiceUndoBtn) {
            voiceUndoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                undoVoice();
                voiceArea.focus();
            });
        }

        if (transferToPreetiBtn) {
            transferToPreetiBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const text = voiceArea.value;
                if (!text.trim()) {
                    showToast("No text to convert!");
                    return;
                }
                sessionStorage.setItem('nepalitools_transfer_text', text);
                window.location.href = '/unicode-to-preeti/';
            });
        }

        // Copy & Clear
        bindCopyAction('typing-copy', voiceArea, 'Voice typed text copied!');
        
        const clearBtn = document.getElementById('typing-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                voiceArea.value = "";
                voiceArea.dispatchEvent(new Event('input', { bubbles: true }));
                showToast("Cleared!");
            });
        }

        // Global key shortcut (only active when this page is loaded)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                toggleVoiceTyping();
            }
        });
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
