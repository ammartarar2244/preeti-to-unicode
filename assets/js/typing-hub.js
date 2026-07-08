/**
 * NepaliLanguageTools - Typing Hub Engine
 * Handles typing lessons, speed tests, and Lok Sewa exam prep.
 */
class TypingHub {
    static LESSONS_ROMANIZED = [
        { title: "Home Row Keys - Consonants", text: "क स र ग म न ज व क स र ग म न ज व" },
        { title: "Home Row Keys - Vowels & Diacritics", text: "का सि री के सै को का सि री के सै को" },
        { title: "Top Row Keys", text: "त य थ ल प ध भ श त य थ ल प ध भ श" },
        { title: "Bottom Row Keys", text: "च छ ज झ ट ठ ड ढ च छ ज झ ट ठ ड ढ" },
        { title: "Common Sentences - Drill 1", text: "हामी नेपाली हौँ र हाम्रो देश नेपाल हो।" },
        { title: "Common Sentences - Drill 2", text: "कस्तो छ साथी ? मलाई नेपाली भाषा मन पर्छ।" },
        { title: "Lok Sewa Core - Sentence 1", text: "नेपालको नयाँ संविधान संघीय लोकतान्त्रिक गणतन्त्रमा आधारित छ।" },
        { title: "Lok Sewa Core - Sentence 2", text: "सूचना प्रविधिको विकासले सरकारी सेवा प्रवाह छिटो छरितो बनाएको छ।" }
    ];

    static LESSONS_PREETI = [
        { title: "Home Row - Keyboard Keys", text: "cf g s d t a lookup cf g s d t a" },
        { title: "Home Row Characters", text: "ब ग द म न ज व क स र ग म न ज व" },
        { title: "Top Row Characters", text: "त य थ ल प ध भ श त य थ ल प ध भ श" },
        { title: "Lok Sewa Traditional - Drill 1", text: "sf7df8f}F g]kfnsf] /fhlwfgL xf] ." },
        { title: "Lok Sewa Traditional - Drill 2", text: "sfg'gsf] clwsf/ ;a}nfO{ a/fa/ x'G5 ." }
    ];

    static SPEED_TEST_TEXTS = {
        easy: [
            "नेपाल एउटा सुन्दर र शान्त देश हो। यहाँ विभिन्न जातजाति र भाषाभाषीका मानिसहरू बसोबास गर्दछन्।",
            "हामीले दैनिक रूपमा नेपाली टाइपिङ अभ्यास गर्दा हाम्रो गति र शुद्धतामा सुधार आउँछ। यसले काममा सजिलो बनाउँछ।",
            "नयाँ प्रविधिको प्रयोगले सञ्चार क्षेत्रमा क्रान्ति ल्याएको छ। यसले संसारलाई नजिक बनाएको छ।"
        ],
        medium: [
            "नेपालको संविधानले सबै नागरिकलाई समान अधिकार दिएको छ। सरकारी सेवा र सुविधाहरूमा सबैको पहुँच हुनु आवश्यक छ।",
            "Touch typing भनेको किबोर्डमा नहेरी औंलाहरूको स्मरणशक्तिको भरमा छिटो टाइपिङ गर्ने वैज्ञानिक तरिका हो।",
            "नेपाल सरकारले सूचना प्रविधिलाई प्राथमिकतामा राखेर विभिन्न डिजिटल सेवाहरू सञ्चालनमा ल्याएको छ।"
        ],
        hard: [
            "संघीय लोकतान्त्रिक गणतन्त्र नेपालको मूल संरचना संघ, प्रदेश र स्थानीय तह गरी तीन तहको हुने व्यवस्था संविधानमा उल्लेख छ।",
            "प्रविधिको द्रुततर विकासले राष्ट्रिय अर्थतन्त्रका विविध क्षेत्रमा सकारात्मक प्रभाव पार्नुका साथै सार्वजनिक प्रशासनलाई डिजिटल प्रणालीमा रूपान्तरण गरेको छ।"
        ]
    };

    // Keyboard highlight mappings
    static romanizedKeyMap = {
        'क': 'KeyS', 'स': 'KeyS', 'र': 'KeyR', 'ग': 'KeyG', 'म': 'KeyD', 'न': 'KeyG', 'ज': 'KeyH', 'व': 'KeyJ',
        'ा': 'KeyA', 'ि': 'KeyZ', 'ी': 'KeyX', 'े': 'KeyB', 'ै': 'KeyN', 'ो': 'KeyM', 'ौ': 'Comma',
        'त': 'KeyL', 'थ': 'KeyY', 'ल': 'KeyL', 'प': 'KeyP', 'ध': 'KeyW', 'भ': 'KeyE', 'श': 'KeyU', 'ष': 'KeyI', 'ज्ञ': 'KeyO',
        'च': 'KeyR', 'छ': 'KeyR', '्': 'BracketLeft', '।': 'BracketRight', ' ': 'Space',
        'a': 'KeyA', 'b': 'KeyB', 'c': 'KeyC', 'd': 'KeyD', 'e': 'KeyE', 'f': 'KeyF', 'g': 'KeyG', 'h': 'KeyH', 'i': 'KeyI',
        'j': 'KeyJ', 'k': 'KeyK', 'l': 'KeyL', 'm': 'KeyM', 'n': 'KeyN', 'o': 'KeyO', 'p': 'KeyP', 'q': 'KeyQ', 'r': 'KeyR',
        's': 'KeyS', 't': 'KeyT', 'u': 'KeyU', 'v': 'KeyV', 'w': 'KeyW', 'x': 'KeyX', 'y': 'KeyY', 'z': 'KeyZ'
    };

    static preetiKeyMap = {
        'क': 'KeyS', 'ख': 'KeyV', 'ग': 'KeyU', 'घ': 'KeyU', 'ङ': 'KeyU',
        'च': 'KeyR', 'छ': 'KeyR', 'ज': 'KeyH', 'झ': 'KeyH', 'ञ': 'KeyH',
        'ट': 'KeyT', 'ठ': 'KeyT', 'ड': 'KeyY', 'ढ': 'KeyY', 'ण': 'KeyY',
        'त': 'KeyL', 'थ': 'KeyY', 'द': 'KeyI', 'ध': 'KeyW', 'न': 'KeyG',
        'प': 'KeyP', 'फ': 'KeyP', 'ब': 'KeyB', 'भ': 'KeyE', 'म': 'KeyD',
        'य': 'KeyO', 'र': 'KeySlash', 'ल': 'KeyN', 'व': 'KeyJ',
        'श': 'KeyU', 'ष': 'KeyI', 'स': 'KeyX', 'ह': 'KeyH',
        'ा': 'KeyF', 'ि': 'KeyL', 'ी': 'KeyO', 'ु': 'KeyM', 'ू': 'KeyM',
        'े': 'KeyS', 'ै': 'KeyA', 'ो': 'KeyF', 'ौ': 'KeyF', 'ं': 'KeyA',
        '्': 'KeyD', '।': 'KeyDot', ' ': 'Space'
    };

    static shiftChars = new Set(['ध', 'भ', 'थ', 'श', 'ष', 'ज्ञ', 'छ', 'ी', 'ै', 'ौ', 'त्र', '।', '॥', '?', '+', '_', '~']);

    static initPractice(layout, displayId, inputId, wpmId, accId, timeId, listId) {
        const display = document.getElementById(displayId);
        const input = document.getElementById(inputId);
        const wpm = document.getElementById(wpmId);
        const acc = document.getElementById(accId);
        const timer = document.getElementById(timeId);
        const lessonList = document.getElementById(listId);

        if (!display || !input) return;

        let lessonListDataset = layout === 'preeti' ? this.LESSONS_PREETI : this.LESSONS_ROMANIZED;
        let lessonIndex = 0;
        let originalText = lessonListDataset[lessonIndex].text;
        let startTime = null;
        let totalKeys = 0;
        let errors = 0;
        let timerInterval = null;

        // Dynamic lesson selector building
        if (lessonList) {
            lessonList.innerHTML = lessonListDataset.map((l, idx) => `
                <option value="${idx}">${l.title}</option>
            `).join('');
            
            lessonList.addEventListener('change', (e) => {
                lessonIndex = parseInt(e.target.value);
                resetPractice();
            });
        }

        // Intercept inputs with layout transliterator if Romanized or Preeti traditional
        if (layout === 'romanized') {
            if (typeof Nepalify !== 'undefined') {
                Nepalify.intercept(input, 'romanized');
            }
        } else if (layout === 'preeti') {
            // Preeti physical key interception is handled client-side
            input.classList.add('preeti-font');
        }

        const resetPractice = () => {
            originalText = lessonListDataset[lessonIndex].text;
            input.value = "";
            startTime = null;
            totalKeys = 0;
            errors = 0;
            if (timerInterval) clearInterval(timerInterval);
            if (wpm) wpm.textContent = "0";
            if (acc) acc.textContent = "100%";
            if (timer) timer.textContent = "0s";
            renderDisplay();
            updateHighlight();
        };

        const renderDisplay = () => {
            const val = input.value;
            let html = "";
            for (let i = 0; i < originalText.length; i++) {
                const char = originalText[i];
                if (i < val.length) {
                    if (val[i] === char) {
                        html += `<span class="correct">${char}</span>`;
                    } else {
                        html += `<span class="incorrect">${char}</span>`;
                    }
                } else if (i === val.length) {
                    html += `<span class="current">${char}</span>`;
                } else {
                    html += `<span>${char}</span>`;
                }
            }
            display.innerHTML = html;
        };

        const updateHighlight = () => {
            const keys = document.querySelectorAll('.keyboard-key');
            keys.forEach(k => k.classList.remove('highlight'));
            
            const len = input.value.length;
            if (len < originalText.length) {
                const nextChar = originalText[len].toLowerCase();
                const map = layout === 'preeti' ? this.preetiKeyMap : this.romanizedKeyMap;
                const targetKey = map[nextChar] || map[originalText[len]];
                
                if (targetKey) {
                    const keyEl = document.querySelector(`.keyboard-key[data-key="${targetKey}"]`);
                    if (keyEl) keyEl.classList.add('highlight');
                }

                if (this.shiftChars.has(originalText[len])) {
                    const shift = document.querySelector('.keyboard-key[data-key="ShiftLeft"]');
                    if (shift) shift.classList.add('highlight');
                }
            }
        };

        const updateStats = () => {
            if (!startTime) return;
            const elapsed = (new Date() - startTime) / 1000;
            if (timer) timer.textContent = Math.round(elapsed) + "s";
            
            const val = input.value;
            let correct = 0;
            for (let i = 0; i < val.length; i++) {
                if (val[i] === originalText[i]) correct++;
            }
            
            const accRate = val.length > 0 ? Math.round((correct / val.length) * 100) : 100;
            if (acc) acc.textContent = accRate + "%";

            // Standard WPM: (correct characters / 5) / minutes
            const minutes = elapsed / 60;
            const grossWpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
            if (wpm) wpm.textContent = grossWpm;
        };

        input.addEventListener('input', () => {
            if (!startTime) {
                startTime = new Date();
                timerInterval = setInterval(updateStats, 1000);
            }
            renderDisplay();
            updateHighlight();
            updateStats();

            // Finish check
            if (input.value.length >= originalText.length) {
                if (timerInterval) clearInterval(timerInterval);
                window.showToast?.("Lesson completed successfully!");
                setTimeout(resetPractice, 2000);
            }
        });

        // Trigger initial rendering
        resetPractice();

        return { reset: resetPractice };
    }

    static initSpeedTest(layout, displayId, inputId, wpmId, accId, timeId, difficultyId, startBtnId) {
        const display = document.getElementById(displayId);
        const input = document.getElementById(inputId);
        const wpm = document.getElementById(wpmId);
        const acc = document.getElementById(accId);
        const timer = document.getElementById(timeId);
        const diffSelect = document.getElementById(difficultyId);
        const startBtn = document.getElementById(startBtnId);

        if (!display || !input) return;

        let originalText = "";
        let timerVal = 60; // 1-minute test
        let timeLeft = 60;
        let startTime = null;
        let timerInterval = null;
        let active = false;

        if (layout === 'romanized' && typeof Nepalify !== 'undefined') {
            Nepalify.intercept(input, 'romanized');
        } else if (layout === 'preeti') {
            input.classList.add('preeti-font');
        }

        const renderDisplay = () => {
            const val = input.value;
            let html = "";
            for (let i = 0; i < originalText.length; i++) {
                const char = originalText[i];
                if (i < val.length) {
                    if (val[i] === char) {
                        html += `<span class="correct">${char}</span>`;
                    } else {
                        html += `<span class="incorrect">${char}</span>`;
                    }
                } else if (i === val.length) {
                    html += `<span class="current">${char}</span>`;
                } else {
                    html += `<span>${char}</span>`;
                }
            }
            display.innerHTML = html;
        };

        const resetTest = () => {
            const diff = diffSelect ? diffSelect.value : 'medium';
            const texts = this.SPEED_TEST_TEXTS[diff] || this.SPEED_TEST_TEXTS['medium'];
            originalText = texts[Math.floor(Math.random() * texts.length)];
            
            input.value = "";
            input.disabled = true;
            startTime = null;
            timeLeft = timerVal;
            active = false;
            if (timerInterval) clearInterval(timerInterval);
            
            if (wpm) wpm.textContent = "0";
            if (acc) acc.textContent = "100%";
            if (timer) timer.textContent = timeLeft + "s";
            if (startBtn) startBtn.disabled = false;
            
            renderDisplay();
        };

        const startTest = () => {
            resetTest();
            input.disabled = false;
            input.focus();
            active = true;
            if (startBtn) startBtn.disabled = true;
            window.showToast?.("Speed test started! Begin typing...");
        };

        const updateTimer = () => {
            if (!startTime) return;
            const elapsed = (new Date() - startTime) / 1000;
            timeLeft = Math.max(0, timerVal - Math.round(elapsed));
            if (timer) timer.textContent = timeLeft + "s";

            // Calculate live stats
            const val = input.value;
            let correct = 0;
            for (let i = 0; i < val.length; i++) {
                if (val[i] === originalText[i]) correct++;
            }
            const accRate = val.length > 0 ? Math.round((correct / val.length) * 100) : 100;
            if (acc) acc.textContent = accRate + "%";

            const minutes = elapsed / 60;
            const liveWpm = minutes > 0 ? Math.round((correct / 5) / minutes) : 0;
            if (wpm) wpm.textContent = liveWpm;

            if (timeLeft <= 0) {
                endTest();
            }
        };

        const endTest = () => {
            input.disabled = true;
            active = false;
            if (timerInterval) clearInterval(timerInterval);
            window.showToast?.("Time's up! Speed test completed.");
            
            // Save to highscores
            try {
                const results = JSON.parse(localStorage.getItem('nepalitools_typing_stats') || '[]');
                results.push({
                    layout: layout,
                    wpm: parseInt(wpm.textContent),
                    accuracy: acc.textContent,
                    date: new Date().toLocaleDateString()
                });
                localStorage.setItem('nepalitools_typing_stats', JSON.stringify(results));
            } catch (e) {
                console.error("Failed to save highscore:", e);
            }
        };

        input.addEventListener('input', () => {
            if (!active) return;
            if (!startTime) {
                startTime = new Date();
                timerInterval = setInterval(updateTimer, 1000);
            }
            renderDisplay();
            updateTimer();
        });

        if (startBtn) {
            startBtn.addEventListener('click', startTest);
        }

        resetTest();

        return { reset: resetTest, start: startTest };
    }

    static initLokSewa(type, displayId, inputId, wpmId, accId, timeId, startBtnId) {
        const display = document.getElementById(displayId);
        const input = document.getElementById(inputId);
        const wpm = document.getElementById(wpmId);
        const acc = document.getElementById(accId);
        const timer = document.getElementById(timeId);
        const startBtn = document.getElementById(startBtnId);

        if (!display || !input) return;

        // Lok Sewa official paragraph database
        const lokSewaTexts = [
            "नेपाल एउटा संघीय लोकतान्त्रिक गणतन्त्रात्मक मुलुक हो। देशको शासन प्रणालीलाई चुस्त र छिटो छरितो बनाउन निजामती प्रशासनको भूमिका महत्वपूर्ण रहन्छ। लोक सेवा आयोगले निष्पक्ष रूपमा योग्य उम्मेदवारहरू छनोट गरी राष्ट्र सेवामा खटाउँछ। टाइपिङ सीप पनि सोही परीक्षाको एक अभिन्न अंग हो।",
            "नेपालको सरकारी कार्यालयहरूमा हाल नेपाली युनिकोडको प्रयोग अनिवार्य गरिएको छ। पहिले परम्परागत प्रिती फन्टको प्रयोग धेरै मात्रामा भएतापनि आधुनिक समयमा युनिकोडले सूचना प्रविधिमा नयाँ आयाम थपेको छ। यसले नेपाली भाषालाई विश्वव्यापी डिजिटल मञ्चमा सजिलै खोज्न सकिने बनाएको छ।"
        ];

        let originalText = lokSewaTexts[Math.floor(Math.random() * lokSewaTexts.length)];
        let testDuration = type === 'test' ? 600 : 120; // 10 minutes for test, 2 minutes for practice
        let timeLeft = testDuration;
        let startTime = null;
        let timerInterval = null;
        let active = false;

        if (typeof Nepalify !== 'undefined') {
            Nepalify.intercept(input, 'romanized');
        }

        const renderDisplay = () => {
            const val = input.value;
            let html = "";
            for (let i = 0; i < originalText.length; i++) {
                const char = originalText[i];
                if (i < val.length) {
                    if (val[i] === char) {
                        html += `<span class="correct">${char}</span>`;
                    } else {
                        html += `<span class="incorrect">${char}</span>`;
                    }
                } else if (i === val.length) {
                    html += `<span class="current">${char}</span>`;
                } else {
                    html += `<span>${char}</span>`;
                }
            }
            display.innerHTML = html;
        };

        const resetTest = () => {
            originalText = lokSewaTexts[Math.floor(Math.random() * lokSewaTexts.length)];
            input.value = "";
            input.disabled = true;
            startTime = null;
            timeLeft = testDuration;
            active = false;
            if (timerInterval) clearInterval(timerInterval);
            
            if (wpm) wpm.textContent = "0";
            if (acc) acc.textContent = "100%";
            if (timer) timer.textContent = Math.floor(timeLeft / 60) + ":" + String(timeLeft % 60).padStart(2, '0');
            if (startBtn) startBtn.disabled = false;
            
            renderDisplay();
        };

        const startTest = () => {
            resetTest();
            input.disabled = false;
            input.focus();
            active = true;
            if (startBtn) startBtn.disabled = true;
            window.showToast?.("Lok Sewa Test Started! Maintain accuracy.");
        };

        const updateTimer = () => {
            if (!startTime) return;
            const elapsed = (new Date() - startTime) / 1000;
            timeLeft = Math.max(0, testDuration - Math.round(elapsed));
            
            if (timer) {
                timer.textContent = Math.floor(timeLeft / 60) + ":" + String(timeLeft % 60).padStart(2, '0');
            }

            const val = input.value;
            let correct = 0;
            let errorsCount = 0;
            for (let i = 0; i < val.length; i++) {
                if (val[i] === originalText[i]) {
                    correct++;
                } else {
                    errorsCount++;
                }
            }
            
            // Lok Sewa Accuracy: standard percentage
            const accRate = val.length > 0 ? Math.round((correct / val.length) * 100) : 100;
            if (acc) acc.textContent = accRate + "%";

            // Net WPM: (correct characters - error penalties) / 5 / minutes
            const minutes = elapsed / 60;
            const liveWpm = minutes > 0 ? Math.round(((correct - (errorsCount * 2)) / 5) / minutes) : 0;
            if (wpm) wpm.textContent = Math.max(0, liveWpm);

            if (timeLeft <= 0) {
                endTest();
            }
        };

        const endTest = () => {
            input.disabled = true;
            active = false;
            if (timerInterval) clearInterval(timerInterval);
            window.showToast?.("Lok Sewa simulation finished!");
        };

        input.addEventListener('input', () => {
            if (!active) return;
            if (!startTime) {
                startTime = new Date();
                timerInterval = setInterval(updateTimer, 1000);
            }
            renderDisplay();
            updateTimer();
        });

        if (startBtn) {
            startBtn.addEventListener('click', startTest);
        }

        resetTest();

        return { reset: resetTest, start: startTest };
    }
}

// Bind class globally
window.TypingHub = TypingHub;
