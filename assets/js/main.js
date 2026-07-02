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
    // -------------------------------------------------------------
    // 8. Nepali Typing Practice Module (Typeshala Mode)
    // -------------------------------------------------------------
    const practiceDisplay = document.getElementById('practice-display');
    const practiceInput = document.getElementById('practice-input');
    const tabPractice = document.getElementById('typeshala-tab-practice');
    const tabGame = document.getElementById('typeshala-tab-game');
    const panePractice = document.getElementById('pane-practice');
    const paneGame = document.getElementById('pane-game');

    // 8.1 Tabs Control
    if (tabPractice && tabGame && panePractice && paneGame) {
        tabPractice.addEventListener('click', () => {
            tabPractice.classList.add('active');
            tabGame.classList.remove('active');
            panePractice.classList.add('active');
            paneGame.classList.remove('active');
            // Pause the canvas game if it is active
            stopGame();
        });
        tabGame.addEventListener('click', () => {
            tabGame.classList.add('active');
            tabPractice.classList.remove('active');
            paneGame.classList.add('active');
            panePractice.classList.remove('active');
            // Start focusing the game input
            const gInput = document.getElementById('game-input');
            if (gInput && !gInput.disabled) {
                gInput.focus();
            }
        });
    }

    if (practiceDisplay && practiceInput) {
        // Typing lessons categorized by row difficulty
        const lessons = [
            // Home Row Consonants
            "क स र ग म न ज व क स र ग म न ज व",
            // Home Row Vowels
            "का सि री के सै को का सि री के सै को",
            // Top Row Practice
            "त य थ ल प ध भ श त य थ ल प ध भ श",
            // Bottom Row Practice
            "च छ ज झ ट ठ ड ढ च छ ज झ ट ठ ड ढ",
            // Common Phrases
            "कस्तो छ साथी ? मलाई नेपाली भाषा मन पर्छ।",
            // Introduction to Nepal
            "नेपाल एउटा अत्यन्तै सुन्दर र शान्त देश हो।",
            // Language & Culture
            "हामी नेपाली हौँ र हाम्रो कला संस्कृति निकै धनी छ।",
            // Technology & Future
            "सञ्चार प्रविधिले गर्दा संसार एउटा सानो गाउँ जस्तो भएको छ।"
        ];

        let lessonIndex = 0;
        let originalText = lessons[lessonIndex];
        let startTime = null;
        let totalKeysPressed = 0;
        let errors = 0;
        let timerInterval = null;

        // Romanized keyboard layout key highlight map
        const romanizedKeyMap = {
            'क': 'KeyS', 'स': 'KeyS', 'र': 'KeyR', 'ग': 'KeyG', 'म': 'KeyD', 'न': 'KeyG', 'ज': 'KeyH', 'व': 'KeyJ',
            'ा': 'KeyA', 'ि': 'KeyZ', 'ी': 'KeyX', 'े': 'KeyB', 'ै': 'KeyN', 'ो': 'KeyM', 'ौ': 'Comma',
            'त': 'KeyL', 'थ': 'KeyY', 'ल': 'KeyL', 'प': 'KeyP', 'ध': 'KeyW', 'भ': 'KeyE', 'श': 'KeyU', 'ष': 'KeyI', 'ज्ञ': 'KeyO',
            'च': 'KeyR', 'छ': 'KeyR', '्': 'BracketLeft', '।': 'BracketRight', ' ': 'Space',
            'a': 'KeyA', 'b': 'KeyB', 'c': 'KeyC', 'd': 'KeyD', 'e': 'KeyE', 'f': 'KeyF', 'g': 'KeyG', 'h': 'KeyH', 'i': 'KeyI',
            'j': 'KeyJ', 'k': 'KeyK', 'l': 'KeyL', 'm': 'KeyM', 'n': 'KeyN', 'o': 'KeyO', 'p': 'KeyP', 'q': 'KeyQ', 'r': 'KeyR',
            's': 'KeyS', 't': 'KeyT', 'u': 'KeyU', 'v': 'KeyV', 'w': 'KeyW', 'x': 'KeyX', 'y': 'KeyY', 'z': 'KeyZ',
            '०': 'Digit0', '१': 'Digit1', '२': 'Digit2', '३': 'Digit3', '४': 'Digit4', '५': 'Digit5', '६': 'Digit6', '७': 'Digit7', '८': 'Digit8', '९': 'Digit9'
        };

        const shiftChars = new Set(['ध', 'भ', 'थ', 'श', 'ष', 'ज्ञ', 'छ', 'ी', 'ै', 'ौ', 'त्र', '।', '॥', '?', '+', '_', '~']);

        // Intercept input text boxes with romanized layout
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
            updateKeyboardHighlight();
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

        const updateKeyboardHighlight = () => {
            // Remove highlight class from all keys
            const keys = document.querySelectorAll('.keyboard-key');
            keys.forEach(k => k.classList.remove('highlight'));

            const inputLength = practiceInput.value.length;
            if (inputLength < originalText.length) {
                const nextChar = originalText[inputLength].toLowerCase();
                const targetKey = romanizedKeyMap[nextChar] || romanizedKeyMap[originalText[inputLength]];
                
                if (targetKey) {
                    const keyEl = document.querySelector(`.keyboard-key[data-key="${targetKey}"]`);
                    if (keyEl) {
                        keyEl.classList.add('highlight');
                    }
                }
                
                // Highlight Shift key if needed
                if (shiftChars.has(originalText[inputLength])) {
                    const leftShift = document.querySelector('.keyboard-key[data-key="ShiftLeft"]');
                    if (leftShift) leftShift.classList.add('highlight');
                }
            }
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
            updateKeyboardHighlight();

            // Check if lesson is complete
            if (inputVal === originalText) {
                clearInterval(timerInterval);
                showToast("Lesson Complete! Excellent job!");
                // Next lesson
                lessonIndex = (lessonIndex + 1) % lessons.length;
                const lessonSelect = document.getElementById('lesson-select');
                if (lessonSelect) {
                    lessonSelect.value = lessonIndex;
                }
                setTimeout(resetPractice, 1500);
            }
        });

        const updateStats = () => {
            if (!startTime) return;
            
            const timeElapsed = (new Date() - startTime) / 1000;
            const inputLength = practiceInput.value.length;
            
            const wpm = timeElapsed > 0 ? Math.round((inputLength / 5) / (timeElapsed / 60)) : 0;
            const accuracy = totalKeysPressed > 0 ? Math.round(((totalKeysPressed - errors) / totalKeysPressed) * 100) : 100;

            document.getElementById('practice-wpm').textContent = wpm;
            document.getElementById('practice-accuracy').textContent = `${Math.max(0, accuracy)}%`;
            document.getElementById('practice-timer').textContent = `${Math.round(timeElapsed)}s`;
        };

        // Lesson selector mapping
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

    // 8.2 Typeshala Game Engine (Falling Devanagari Characters)
    const gameCanvas = document.getElementById('typeshala-canvas');
    const gameInput = document.getElementById('game-input');
    const gameStartBtn = document.getElementById('game-start-btn');

    let gameRunning = false;
    let gameLoopId = null;
    let spawnIntervalId = null;
    let score = 0;
    let lives = 3;
    let level = 1;
    let fallingChars = [];
    let explosionParticles = [];
    let lastTime = 0;

    const gameCharactersPool = [
        'क', 'ख', 'ग', 'घ', 'च', 'छ', 'ज', 'झ', 'ट', 'ठ', 
        'ड', 'ढ', 'त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 
        'भ', 'म', 'य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह'
    ];

    const vibrantColors = [
        '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', 
        '#ec4899', '#f43f5e', '#06b6d4', '#14b8a6', '#84cc16'
    ];

    if (gameCanvas && gameInput && gameStartBtn) {
        const ctx = gameCanvas.getContext('2d');
        Nepalify.intercept(gameInput, 'romanized');

        // Spawn a new character at the top of the canvas
        const spawnCharacter = () => {
            if (!gameRunning) return;
            
            const randomChar = gameCharactersPool[Math.floor(Math.random() * gameCharactersPool.length)];
            const randomX = 50 + Math.random() * (gameCanvas.width - 100);
            const speed = 1.0 + (level * 0.3) + Math.random() * 0.5;
            const color = vibrantColors[Math.floor(Math.random() * vibrantColors.length)];

            fallingChars.push({
                char: randomChar,
                x: randomX,
                y: 0,
                speed: speed,
                color: color,
                size: 28 + Math.random() * 6
            });
        };

        // Create canvas explosion particle effect
        const createExplosion = (x, y, color) => {
            const numParticles = 12 + Math.floor(Math.random() * 8);
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: x,
                    y: y,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 0.5) * 6,
                    radius: 2 + Math.random() * 3,
                    color: color,
                    alpha: 1.0,
                    decay: 0.02 + Math.random() * 0.02
                });
            }
        };

        let particles = [];

        // Game Animation Loop
        const gameLoop = (timestamp) => {
            if (!gameRunning) return;

            // Clear screen
            ctx.fillStyle = '#0f0f11';
            ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

            // Draw grid backdrop
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 1;
            for (let x = 0; x < gameCanvas.width; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, gameCanvas.height);
                ctx.stroke();
            }
            for (let y = 0; y < gameCanvas.height; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(gameCanvas.width, y);
                ctx.stroke();
            }

            // Draw and update falling characters
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            
            for (let i = fallingChars.length - 1; i >= 0; i--) {
                const c = fallingChars[i];
                c.y += c.speed;

                // Draw character with custom glow
                ctx.shadowColor = c.color;
                ctx.shadowBlur = 8;
                ctx.fillStyle = c.color;
                ctx.font = `bold ${c.size}px 'Noto Sans Devanagari', sans-serif`;
                ctx.fillText(c.char, c.x, c.y);
                ctx.shadowBlur = 0; // Reset shadow

                // Check collision with the bottom boundary
                if (c.y > gameCanvas.height) {
                    fallingChars.splice(i, 1);
                    lives--;
                    document.getElementById('game-lives').textContent = lives;

                    // Red flash effect
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

                    if (lives <= 0) {
                        gameOver();
                        return;
                    }
                }
            }

            // Draw and update explosion particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.decay;

                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                } else {
                    ctx.save();
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            gameLoopId = requestAnimationFrame(gameLoop);
        };

        const startGame = () => {
            gameRunning = true;
            score = 0;
            lives = 3;
            level = 1;
            fallingChars = [];
            particles = [];

            document.getElementById('game-score').textContent = score;
            document.getElementById('game-lives').textContent = lives;
            document.getElementById('game-level').textContent = level;

            gameInput.disabled = false;
            gameInput.value = "";
            gameInput.focus();
            gameStartBtn.textContent = "Restart Game";

            // Spawn loop
            if (spawnIntervalId) clearInterval(spawnIntervalId);
            spawnIntervalId = setInterval(spawnCharacter, 1800);

            // Draw start prompt
            ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
            gameLoopId = requestAnimationFrame(gameLoop);
            showToast("Game Started! Type the falling characters!");
        };

        const stopGame = () => {
            gameRunning = false;
            if (gameLoopId) cancelAnimationFrame(gameLoopId);
            if (spawnIntervalId) clearInterval(spawnIntervalId);
            gameInput.disabled = true;
            gameInput.value = "";
            gameStartBtn.textContent = "Start Game";
        };

        const gameOver = () => {
            stopGame();
            
            // Draw Game Over overlay
            ctx.fillStyle = 'rgba(15, 15, 17, 0.85)';
            ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
            
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.fillStyle = '#ef4444';
            ctx.font = "bold 42px 'Outfit', sans-serif";
            ctx.fillText("GAME OVER", gameCanvas.width / 2, gameCanvas.height / 2 - 30);
            
            ctx.fillStyle = '#e4e4e7';
            ctx.font = "600 20px 'Inter', sans-serif";
            ctx.fillText(`Final Score: ${score} points (Level ${level})`, gameCanvas.width / 2, gameCanvas.height / 2 + 20);
            
            ctx.fillStyle = '#a1a1aa';
            ctx.font = "14px 'Inter', sans-serif";
            ctx.fillText("Click 'Restart Game' to try again", gameCanvas.width / 2, gameCanvas.height / 2 + 60);
        };

        // Listen for typed inputs to hit the letters
        gameInput.addEventListener('input', () => {
            const val = gameInput.value;
            if (val.length > 0) {
                const typedChar = val[val.length - 1];
                
                // Find matching character closest to the bottom (max Y)
                let matchedIndex = -1;
                let maxY = -1;

                for (let i = 0; i < fallingChars.length; i++) {
                    if (fallingChars[i].char === typedChar && fallingChars[i].y > maxY) {
                        maxY = fallingChars[i].y;
                        matchedIndex = i;
                    }
                }

                if (matchedIndex !== -1) {
                    const match = fallingChars[matchedIndex];
                    createExplosion(match.x, match.y, match.color);
                    fallingChars.splice(matchedIndex, 1);
                    
                    // Increment score
                    score += 10;
                    document.getElementById('game-score').textContent = score;

                    // Level Up logic
                    if (score > 0 && score % 100 === 0) {
                        level++;
                        document.getElementById('game-level').textContent = level;
                        showToast(`Level ${level}! Speeding up!`);
                        
                        // Recalculate spawning interval
                        clearInterval(spawnIntervalId);
                        const newSpeed = Math.max(700, 1800 - (level * 150));
                        spawnIntervalId = setInterval(spawnCharacter, newSpeed);
                    }
                }

                // Clear input so they can type another letter immediately
                gameInput.value = "";
            }
        });

        // Trigger start/restart
        gameStartBtn.addEventListener('click', () => {
            startGame();
        });
    }

    // Export global stopGame helper
    window.stopGame = stopGame;

    // -------------------------------------------------------------
    // 9. Nepali Voice Typing Page Bindings

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
    // 10. Nepali Docs — Rich Document Editor
    // -------------------------------------------------------------
    const docsEditor = document.getElementById('docs-editor');
    if (docsEditor) {
        const docsTitle = document.getElementById('docs-title');
        const saveStatus = document.getElementById('docs-save-status');
        const toolbar = document.getElementById('docs-toolbar');

        // Formatting toolbar buttons
        if (toolbar) {
            toolbar.addEventListener('click', (e) => {
                const btn = e.target.closest('.docs-tool-btn');
                if (!btn || btn.id === 'docs-insert-date') return;
                e.preventDefault();

                const cmd = btn.getAttribute('data-cmd');
                if (!cmd) return;

                const val = btn.getAttribute('data-val') || null;
                docsEditor.focus();
                document.execCommand(cmd, false, val);
            });
        }

        // Color pickers
        const textColorBtn = document.getElementById('docs-text-color-btn');
        const textColorInput = document.getElementById('docs-text-color-input');
        const textColorIndicator = document.getElementById('docs-text-color-indicator');
        if (textColorBtn && textColorInput) {
            textColorBtn.addEventListener('click', (e) => {
                e.preventDefault();
                textColorInput.click();
            });
            textColorInput.addEventListener('input', () => {
                docsEditor.focus();
                document.execCommand('foreColor', false, textColorInput.value);
                if (textColorIndicator) {
                    textColorIndicator.style.backgroundColor = textColorInput.value;
                }
            });
        }

        const highlightBtn = document.getElementById('docs-highlight-btn');
        const highlightInput = document.getElementById('docs-highlight-input');
        const highlightIndicator = document.getElementById('docs-highlight-indicator');
        if (highlightBtn && highlightInput) {
            highlightBtn.addEventListener('click', (e) => {
                e.preventDefault();
                highlightInput.click();
            });
            highlightInput.addEventListener('input', () => {
                docsEditor.focus();
                document.execCommand('hiliteColor', false, highlightInput.value);
                if (highlightIndicator) {
                    highlightIndicator.style.backgroundColor = highlightInput.value;
                }
            });
        }

        // Insert Nepali Date (Bikram Sambat)
        const insertDateBtn = document.getElementById('docs-insert-date');
        if (insertDateBtn) {
            insertDateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const bsDate = getNepaliDateString();
                docsEditor.focus();
                document.execCommand('insertText', false, bsDate);
            });
        }

        // Bikram Sambat Date Converter
        function getNepaliDateString() {
            const bsMonths = ['बैशाख', 'जेठ', 'असार', 'श्रावण', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत्र'];
            const nepDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
            const daysInMonth = [
                [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31], // 2080
                [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30], // 2081
                [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30], // 2082
                [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30], // 2083
                [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2084
            ];
            const bsStartYear = 2080;
            const adRefDate = new Date(2023, 3, 14); // April 14, 2023 = 2080/01/01

            const today = new Date();
            let daysDiff = Math.floor((today - adRefDate) / 86400000);

            let bsYear = bsStartYear;
            let bsMonth = 0;
            let bsDay = 1;

            if (daysDiff >= 0) {
                let yearIdx = 0;
                while (yearIdx < daysInMonth.length) {
                    let daysInYear = 0;
                    for (let m = 0; m < 12; m++) daysInYear += daysInMonth[yearIdx][m];
                    if (daysDiff < daysInYear) break;
                    daysDiff -= daysInYear;
                    bsYear++;
                    yearIdx++;
                }
                if (yearIdx < daysInMonth.length) {
                    for (let m = 0; m < 12; m++) {
                        if (daysDiff < daysInMonth[yearIdx][m]) {
                            bsMonth = m;
                            bsDay = daysDiff + 1;
                            break;
                        }
                        daysDiff -= daysInMonth[yearIdx][m];
                    }
                }
            }

            const toNep = (n) => String(n).split('').map(d => nepDigits[parseInt(d)]).join('');
            return `${toNep(bsYear)} ${bsMonths[bsMonth]} ${toNep(bsDay)}`;
        }

        // --- Transliteration for contenteditable ---
        let docsTypingLang = 'ne'; // 'ne' = Roman-to-Nepali, 'en' = English
        let docsRomanBuffer = '';
        let docsLastNepaliLen = 0;

        docsEditor.addEventListener('keydown', (e) => {
            if (docsTypingLang !== 'ne') return;

            // Esc key: keep current word in English
            if (e.key === 'Escape' && docsRomanBuffer) {
                e.preventDefault();
                const sel = window.getSelection();
                if (!sel.rangeCount) return;

                // Delete the current Nepali preview and insert the raw roman buffer
                const range = sel.getRangeAt(0);
                // Move back to delete the preview
                for (let i = 0; i < docsLastNepaliLen; i++) {
                    document.execCommand('delete', false, null);
                }
                document.execCommand('insertText', false, docsRomanBuffer);
                docsRomanBuffer = '';
                docsLastNepaliLen = 0;
                return;
            }
        });

        docsEditor.addEventListener('beforeinput', (e) => {
            if (docsTypingLang !== 'ne') return;

            const data = e.data;
            const inputType = e.inputType;

            // Handle Space / Enter / punctuation: commit word
            if (inputType === 'insertText' && data && /^[\s\n,.?!;:()\[\]{}"'।॥\-]$/.test(data)) {
                docsRomanBuffer = '';
                docsLastNepaliLen = 0;
                return; // let the character be inserted normally
            }

            // Handle character insertion
            if (inputType === 'insertText' && data && /^[a-zA-Z]$/.test(data)) {
                e.preventDefault();

                docsRomanBuffer += data;
                const replacement = Nepalify.transliterateWord(docsRomanBuffer);

                // Delete previous Nepali preview
                for (let i = 0; i < docsLastNepaliLen; i++) {
                    document.execCommand('delete', false, null);
                }
                document.execCommand('insertText', false, replacement);
                docsLastNepaliLen = replacement.length;
                return;
            }

            // Handle delete/backspace: reset buffer
            if (inputType === 'deleteContentBackward' || inputType === 'deleteContentForward') {
                if (docsRomanBuffer.length > 0) {
                    e.preventDefault();
                    // Delete current Nepali preview
                    for (let i = 0; i < docsLastNepaliLen; i++) {
                        document.execCommand('delete', false, null);
                    }
                    docsRomanBuffer = docsRomanBuffer.slice(0, -1);
                    if (docsRomanBuffer) {
                        const replacement = Nepalify.transliterateWord(docsRomanBuffer);
                        document.execCommand('insertText', false, replacement);
                        docsLastNepaliLen = replacement.length;
                    } else {
                        docsLastNepaliLen = 0;
                    }
                    return;
                }
            }

            // For paste or other input types, just reset buffer
            if (inputType === 'insertFromPaste') {
                docsRomanBuffer = '';
                docsLastNepaliLen = 0;
            }
        });

        // Handle paste - transliterate pasted text
        docsEditor.addEventListener('paste', (e) => {
            if (docsTypingLang !== 'ne') return;
            e.preventDefault();
            const clipboardData = e.clipboardData || window.clipboardData;
            const pastedText = clipboardData.getData('text/plain');
            const transliterated = Nepalify.transliterateRomanToUnicode(pastedText);
            document.execCommand('insertText', false, transliterated);
            docsRomanBuffer = '';
            docsLastNepaliLen = 0;
        });

        // Ctrl+G toggle typing language
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('docs-editor')) return;

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                docsTypingLang = docsTypingLang === 'ne' ? 'en' : 'ne';
                docsRomanBuffer = '';
                docsLastNepaliLen = 0;

                // Update language buttons if they exist (as typing language toggle)
                const neLangBtn = document.getElementById('docs-lang-ne');
                const enLangBtn = document.getElementById('docs-lang-en');
                if (neLangBtn && enLangBtn) {
                    if (docsTypingLang === 'ne') {
                        neLangBtn.classList.add('active');
                        enLangBtn.classList.remove('active');
                    } else {
                        enLangBtn.classList.add('active');
                        neLangBtn.classList.remove('active');
                    }
                }
                showToast(docsTypingLang === 'ne' ? 'Typing: Nepali (Roman)' : 'Typing: English');
            }
        });

        // --- Voice Typing for Docs ---
        let docsVoiceLang = 'ne-NP'; // voice recognition language
        let docsRecognition = null;
        let docsIsListening = false;
        let docsSilenceTimer = null;

        const docsMicBtn = document.getElementById('docs-mic-btn');
        const docsLangEn = document.getElementById('docs-lang-en');
        const docsLangNe = document.getElementById('docs-lang-ne');

        // Language toggle buttons affect voice typing language
        if (docsLangEn) {
            docsLangEn.addEventListener('click', () => {
                docsVoiceLang = 'en-US';
                docsTypingLang = 'en';
                docsRomanBuffer = '';
                docsLastNepaliLen = 0;
                docsLangEn.classList.add('active');
                if (docsLangNe) docsLangNe.classList.remove('active');
                if (docsRecognition && docsIsListening) {
                    docsRecognition.lang = 'en-US';
                    try { docsRecognition.stop(); } catch (err) {}
                }
                showToast('Language: English');
            });
        }
        if (docsLangNe) {
            docsLangNe.addEventListener('click', () => {
                docsVoiceLang = 'ne-NP';
                docsTypingLang = 'ne';
                docsRomanBuffer = '';
                docsLastNepaliLen = 0;
                docsLangNe.classList.add('active');
                if (docsLangEn) docsLangEn.classList.remove('active');
                if (docsRecognition && docsIsListening) {
                    docsRecognition.lang = 'ne-NP';
                    try { docsRecognition.stop(); } catch (err) {}
                }
                showToast('Language: नेपाली');
            });
        }

        const resetDocsSilenceTimer = () => {
            if (docsSilenceTimer) { clearTimeout(docsSilenceTimer); docsSilenceTimer = null; }
        };
        const startDocsSilenceTimer = () => {
            resetDocsSilenceTimer();
            docsSilenceTimer = setTimeout(() => {
                showToast('Voice typing stopped after 1 minute of silence.');
                stopDocsListening();
            }, 60000);
        };

        const startDocsListening = () => {
            if (docsRecognition && !docsIsListening) {
                docsRecognition.lang = docsVoiceLang;
                docsIsListening = true;
                try { docsRecognition.start(); } catch (err) { console.error(err); }
            }
        };
        const stopDocsListening = () => {
            if (docsRecognition && docsIsListening) {
                docsIsListening = false;
                try { docsRecognition.stop(); } catch (err) { console.error(err); }
                if (docsMicBtn) docsMicBtn.classList.remove('listening');
                resetDocsSilenceTimer();
            }
        };
        const toggleDocsVoice = () => {
            if (!docsRecognition) {
                showToast('Voice typing not supported in this browser.');
                return;
            }
            if (docsIsListening) stopDocsListening();
            else startDocsListening();
        };

        const docsReplaceVoiceCommands = (text) => {
            let t = text;
            t = t.replace(/पूर्ण विराम/g, '।');
            t = t.replace(/नयाँ लाइन/g, '\n');
            t = t.replace(/प्रश्न चिन्ह/g, '?');
            t = t.replace(/अल्प विराम/g, ',');
            t = t.replace(/उद्गार चिन्ह/g, '!');
            return t;
        };

        const insertDocsVoiceText = (text) => {
            docsEditor.focus();
            // Restore selection to end of content if no selection
            const sel = window.getSelection();
            if (!sel.rangeCount || !docsEditor.contains(sel.anchorNode)) {
                const range = document.createRange();
                range.selectNodeContents(docsEditor);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
            document.execCommand('insertText', false, text);
        };

        // Initialize Speech Recognition for Docs
        const SpeechRecAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecAPI) {
            docsRecognition = new SpeechRecAPI();
            docsRecognition.continuous = true;
            docsRecognition.interimResults = true;
            docsRecognition.lang = docsVoiceLang;

            docsRecognition.onstart = () => {
                docsIsListening = true;
                if (docsMicBtn) docsMicBtn.classList.add('listening');
                startDocsSilenceTimer();
            };
            docsRecognition.onend = () => {
                if (docsIsListening) {
                    try { docsRecognition.start(); } catch (err) {}
                } else {
                    if (docsMicBtn) docsMicBtn.classList.remove('listening');
                    resetDocsSilenceTimer();
                }
            };
            docsRecognition.onerror = (event) => {
                if (event.error === 'not-allowed') {
                    showToast('Microphone permission denied.');
                    stopDocsListening();
                }
            };
            docsRecognition.onresult = (event) => {
                resetDocsSilenceTimer();
                startDocsSilenceTimer();
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        let text = event.results[i][0].transcript;
                        text = docsReplaceVoiceCommands(text);
                        if (text.trim()) {
                            // Add space before if needed
                            const lastChar = docsEditor.textContent.slice(-1);
                            const prefix = (lastChar && !/[\s\n।?,!॥]/.test(lastChar) && !/^[\s\n।?,!॥]/.test(text)) ? ' ' : '';
                            insertDocsVoiceText(prefix + text);
                        }
                    }
                }
            };
        }

        if (docsMicBtn) {
            docsMicBtn.addEventListener('click', (e) => { e.preventDefault(); toggleDocsVoice(); });
        }

        // Ctrl+M to toggle voice
        document.addEventListener('keydown', (e) => {
            if (!document.getElementById('docs-editor')) return;
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                toggleDocsVoice();
            }
        });

        // --- Autosave ---
        let docsSaveTimer = null;
        const saveDocsContent = () => {
            try {
                localStorage.setItem('nepalitools_docs_content', docsEditor.innerHTML);
                if (docsTitle) localStorage.setItem('nepalitools_docs_title', docsTitle.value);
                if (saveStatus) {
                    saveStatus.textContent = '✓ Saved';
                    saveStatus.style.opacity = '1';
                    setTimeout(() => { if (saveStatus) saveStatus.style.opacity = '0.6'; }, 2000);
                }
            } catch (err) {
                console.error('Docs autosave failed:', err);
            }
        };

        const scheduleDocsSave = () => {
            if (saveStatus) {
                saveStatus.textContent = 'Saving...';
                saveStatus.style.opacity = '1';
            }
            if (docsSaveTimer) clearTimeout(docsSaveTimer);
            docsSaveTimer = setTimeout(saveDocsContent, 1500);
        };

        docsEditor.addEventListener('input', scheduleDocsSave);
        if (docsTitle) docsTitle.addEventListener('input', scheduleDocsSave);

        // Restore on load
        try {
            const savedContent = localStorage.getItem('nepalitools_docs_content');
            const savedTitle = localStorage.getItem('nepalitools_docs_title');
            if (savedContent) docsEditor.innerHTML = savedContent;
            if (savedTitle && docsTitle) docsTitle.value = savedTitle;
        } catch (err) {
            console.error('Docs restore failed:', err);
        }

        // --- Action Buttons ---
        // New Document
        const newDocBtn = document.getElementById('docs-new');
        if (newDocBtn) {
            newDocBtn.addEventListener('click', () => {
                if (docsEditor.textContent.trim() && !confirm('Clear the current document and start a new one?')) return;
                docsEditor.innerHTML = '';
                if (docsTitle) docsTitle.value = '';
                saveDocsContent();
                showToast('New document created.');
            });
        }

        // Copy
        const copyDocBtn = document.getElementById('docs-copy');
        if (copyDocBtn) {
            copyDocBtn.addEventListener('click', () => {
                const text = docsEditor.innerText || docsEditor.textContent;
                if (!text.trim()) { showToast('Nothing to copy!'); return; }
                navigator.clipboard.writeText(text)
                    .then(() => showToast('Document text copied!'))
                    .catch(() => showToast('Failed to copy!'));
            });
        }

        // Print
        const printDocBtn = document.getElementById('docs-print');
        if (printDocBtn) {
            printDocBtn.addEventListener('click', () => { window.print(); });
        }

        // Download .txt
        const txtBtn = document.getElementById('docs-download-txt');
        if (txtBtn) {
            txtBtn.addEventListener('click', () => {
                const text = docsEditor.innerText || docsEditor.textContent;
                if (!text.trim()) { showToast('Document is empty!'); return; }
                const title = (docsTitle && docsTitle.value.trim()) || 'Nepali-Document';
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = title + '.txt';
                a.click();
                URL.revokeObjectURL(url);
                showToast('Downloaded as .txt');
            });
        }

        // Download Word (.docx via .doc HTML method)
        const wordBtn = document.getElementById('docs-download-word');
        if (wordBtn) {
            wordBtn.addEventListener('click', () => {
                const content = docsEditor.innerHTML;
                if (!docsEditor.textContent.trim()) { showToast('Document is empty!'); return; }
                const title = (docsTitle && docsTitle.value.trim()) || 'Nepali-Document';

                const docContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
@font-face { font-family: 'Noto Sans Devanagari'; }
body { font-family: 'Noto Sans Devanagari', 'Mangal', sans-serif; font-size: 12pt; line-height: 1.7; color: #000; }
h1 { font-size: 18pt; font-weight: bold; margin-bottom: 8pt; }
h2 { font-size: 15pt; font-weight: bold; margin-bottom: 6pt; }
h3 { font-size: 13pt; font-weight: bold; margin-bottom: 5pt; }
</style>
</head>
<body>
${content}
</body>
</html>`;

                const blob = new Blob(['\ufeff' + docContent], { type: 'application/msword' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = title + '.doc';
                a.click();
                URL.revokeObjectURL(url);
                showToast('Downloaded as Word document.');
            });
        }
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
