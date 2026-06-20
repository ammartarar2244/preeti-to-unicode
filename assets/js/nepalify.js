/**
 * Nepalify Keyboard Engine
 * Intercepts keyboard inputs on textareas/inputs and maps them to Devanagari.
 * Supports phonetic Romanized transliteration, Traditional Preeti-style layouts, and Nepali-to-English reverse transliteration.
 */
class Nepalify {
    // Traditional Preeti-to-Unicode Layout mapping
    static traditional = {
        "a": "ब", "b": "द", "c": "अ", "d": "म", "e": "भ", "f": "ा", "g": "न", "h": "ज", 
        "i": "ष", "j": "व", "k": "प", "l": "ि", "m": "ः", "n": "ल", "o": "य", "p": "उ", 
        "q": "त्र", "r": "च", "s": "क", "t": "त", "u": "ग", "v": "ख", "w": "ध", "x": "ह", 
        "y": "थ", "z": "श", "A": "आ", "B": "ौ", "C": "ऋ", "D": "ङ्ग", "E": "ऐ", "F": "ँ", 
        "G": "द्द", "H": "झ", "I": "क्ष", "J": "ो", "K": "फ", "L": "ी", "M": "ड्ड", "N": "द्य", 
        "O": "इ", "P": "ए", "Q": "त्त", "R": "द्व", "S": "ङ्क", "T": "ट्ट", "U": "ऊ", "V": "ॐ", 
        "W": "ड्ढ", "X": "ह्य", "Y": "ठ्ठ", "Z": "क्क", "0": "०", "1": "१", "2": "२", "3": "३", 
        "4": "४", "5": "५", "6": "६", "7": "७", "8": "८", "9": "९", 
        "!": "ज्ञ", "@": "ई", "#": "घ", "$": "द्ध", "%": "छ", "^": "ट", "&": "ठ", "*": "ड", 
        "(": "ढ", ")": "ण", "`": "ञ", "~": "॥", "-": "औ", "_": "ओ", "+": "‌", "=": "‍", 
        "[": "र्", "{": "ृ", "]": "े", "}": "ै", "\\": "्", "|": "ं", 
        ",": "ऽ", "<": "ङ", ".": "।", ">": "श्र", "/": "र", "?": "रु", 
        ";": "स", ":": "ट्ठ", "'": "ु", '"': "ू"
    };

    // Dictionary of common transliterated words for 100% accurate conversion
    static dictionary = {
        "namaste": "नमस्ते",
        "mero": "मेरो",
        "naam": "नाम",
        "ammar": "अम्मार",
        "ho": "हो",
        "nepal": "नेपाल",
        "sundar": "सुन्दर",
        "desh": "देश",
        "k": "के",
        "cha": "छ",
        "dhanyabad": "धन्यवाद",
        "timro": "तिम्रो",
        "timi": "तिमी",
        "lai": "लाई",
        "tapai": "तपाई",
        "tapaile": "तपाईंले",
        "sanchai": "सञ्चै",
        "ma": "म",
        "malai": "मलाई",
        "hami": "हामी",
        "hamro": "हाम्रो",
        "buda": "बुढा",
        "badi": "बुढी",
        "ramro": "राम्रो",
        "naramro": "नराम्रो",
        "ghar": "घर",
        "bata": "बाट",
        "pani": "पानी",
        "khana": "खाना",
        "khayo": "खायो",
        "aaunu": "आउनु",
        "jannu": "जानु",
        "bholi": "भोलि",
        "aaja": "आज",
        "hijo": "हिजो",
        "sathi": "साथी",
        "ko": "को",
        "ke": "के",
        "che": "चे",
        "chi": "चि",
        "bhaisi": "भैँसी",
        "gai": "गाई",
        "goru": "गोरु",
        "bakhra": "बाख्रा",
        "kukur": "कुकुर",
        "biralo": "बिरालो",
        "khasi": "खासी",
        "sapana": "सपना",
        "manxe": "मान्छे",
        "manche": "मान्छे",
        "kam": "काम",
        "khas": "खास",
        "yasari": "यसरी",
        "tyasari": "त्यसरी",
        "kasari": "कसरी",
        "yas": "यस",
        "tyas": "त्यस",
        "kas": "कस",
        "yo": "यो",
        "tyo": "त्यो",
        "kun": "कुन",
        "kina": "किन",
        "sabai": "सबै",
        "sabaile": "सबैले",
        "bhanda": "भन्दा",
        "thulo": "ठूलो",
        "sano": "सानो",
        "ram": "राम",
        "shyam": "श्याम",
        "hari": "हरि",
        "gita": "गीता",
        "sita": "सीता",
        "laxmi": "लक्ष्मी",
        "lakshmi": "लक्ष्मी",
        "krishna": "कृष्ण",
        "shiva": "शिव",
        "ganesh": "गणेश",
        "vishnu": "विष्णु",
        "brahma": "ब्रह्मा",
        "kathmandu": "काठमाडौँ",
        "pokhara": "पोखरा",
        "lalitpur": "ललितपुर",
        "bhaktapur": "भक्तपुर",
        "dharan": "धरान",
        "itahari": "इटहरी",
        "butwal": "बुटवल",
        "birgunj": "वीरगञ्ज",
        "biratnagar": "विराटनगर",
        "nepali": "नेपाली",
        "bhasa": "भाषा"
    };

    // Consonants mapping for phonetic rule-based transliteration
    static consonants = {
        "ksh": "क्ष", "shh": "ष", "chh": "छ", "kh": "ख", "gh": "घ", "ch": "च", "jh": "झ",
        "th": "थ", "dh": "ध", "Th": "ठ", "Dh": "ढ", "ph": "फ", "bh": "भ", "sh": "श",
        "gy": "ज्ञ", "tr": "त्र", "ng": "ङ", "ny": "ञ", "k": "क", "g": "ग", "c": "च",
        "j": "ज", "t": "त", "d": "द", "n": "न", "T": "ट", "D": "ड", "N": "ण", "p": "प",
        "f": "फ", "b": "ब", "m": "म", "y": "य", "r": "र", "l": "ल", "w": "व", "v": "व",
        "s": "स", "h": "ह", "x": "क्ष"
    };

    // Standalone vowels mapping (when starting a word or following a vowel)
    static standaloneVowels = {
        "aai": "ाई", "aau": "ाउ", "aaa": "आ", "aam": "अं", "aah": "अः", "aa": "आ",
        "ee": "ई", "oo": "ऊ", "ai": "ऐ", "au": "औ", "am": "अं", "ah": "अः", "a": "अ",
        "i": "इ", "u": "उ", "e": "ए", "o": "ओ"
    };

    // Vowel matras mapping (when modifying a consonant)
    static matras = {
        "aai": "ाई", "aau": "ाउ", "aaa": "ा", "aam": "ं", "aah": "ः", "aa": "ा",
        "ee": "ी", "oo": "ू", "ai": "ै", "au": "ौ", "am": "ं", "ah": "ः", "a": "",
        "i": "ि", "u": "ु", "e": "े", "o": "ो"
    };

    // Keep track of active listeners to prevent multiple bindings and leakages
    static activeBindings = new Map();
    static reverseDictionary = null;

    /**
     * Transliterates a single English word phonetically to Nepali Unicode Devanagari.
     * @param {string} word English/Romanized word
     * @returns {string} Nepali Unicode word
     */
    static transliterateWord(word) {
        if (!word) return "";
        
        // Dictionary lookup (case-insensitive)
        const lowerWord = word.toLowerCase();
        if (Nepalify.dictionary[lowerWord]) {
            return Nepalify.dictionary[lowerWord];
        }

        let result = "";
        let i = 0;
        let lastWasConsonant = false;

        while (i < word.length) {
            // 1. Try to match vowel
            let matchedVowel = null;
            let vowelLen = 0;
            for (let vKey in Nepalify.matras) {
                if (word.startsWith(vKey, i)) {
                    if (vKey.length > vowelLen) {
                        matchedVowel = vKey;
                        vowelLen = vKey.length;
                    }
                }
            }

            if (matchedVowel !== null) {
                if (lastWasConsonant) {
                    if (result.endsWith("्")) {
                        result = result.substring(0, result.length - 1);
                    }
                    result += Nepalify.matras[matchedVowel];
                } else {
                    result += Nepalify.standaloneVowels[matchedVowel];
                }
                lastWasConsonant = false;
                i += vowelLen;
                continue;
            }

            // 2. Try to match consonant
            let matchedConsonant = null;
            let consLen = 0;
            for (let cKey in Nepalify.consonants) {
                if (word.startsWith(cKey, i)) {
                    if (cKey.length > consLen) {
                        matchedConsonant = cKey;
                        consLen = cKey.length;
                    }
                }
            }

            if (matchedConsonant !== null) {
                result += Nepalify.consonants[matchedConsonant] + "्";
                lastWasConsonant = true;
                i += consLen;
                continue;
            }

            // 3. Fallback for symbols/numbers
            const char = word.charAt(i);
            if (lastWasConsonant && result.endsWith("्")) {
                result = result.substring(0, result.length - 1);
            }
            result += char;
            lastWasConsonant = false;
            i++;
        }

        // Remove trailing halant from the end of a word (standard phonetic practice)
        if (lastWasConsonant && result.endsWith("्")) {
            result = result.substring(0, result.length - 1);
        }

        return result;
    }

    /**
     * Converts Devanagari text back to Romanized/English phonetic representation.
     * @param {string} text Devanagari input text
     * @returns {string} Romanized English text
     */
    static transliterateUnicodeToRoman(text) {
        if (!text) return "";

        // Build reverse dictionary once
        if (Nepalify.reverseDictionary === null) {
            Nepalify.reverseDictionary = {};
            for (let key in Nepalify.dictionary) {
                const val = Nepalify.dictionary[key];
                if (!Nepalify.reverseDictionary[val]) {
                    Nepalify.reverseDictionary[val] = key;
                }
            }
        }

        // Tokenize by word, keeping spaces and other symbols intact
        const tokens = text.split(/(\s+|[^\u0900-\u097F]+)/);
        return tokens.map(token => {
            if (/^[\u0900-\u097F]+$/.test(token)) {
                if (Nepalify.reverseDictionary[token]) {
                    return Nepalify.reverseDictionary[token];
                }
                return Nepalify.transliterateWordToRoman(token);
            }
            return token;
        }).join('');
    }

    /**
     * Translates a single Devanagari word to Romanized English.
     */
    static transliterateWordToRoman(word) {
        const uniToRomConsonants = {
            "क्ष": "ksh", "ष": "shh", "छ": "chh", "ख": "kh", "घ": "gh", "च": "ch", "झ": "jh",
            "थ": "th", "ध": "dh", "ठ": "Th", "ढ": "Dh", "फ": "ph", "भ": "bh", "श": "sh",
            "ज्ञ": "gy", "त्र": "tr", "ङ": "ng", "ञ": "ny", "क": "k", "ग": "g", "ज": "j",
            "त": "t", "द": "d", "न": "n", "ट": "T", "ड": "D", "ण": "N", "प": "p", "ब": "b",
            "म": "m", "य": "y", "र": "r", "ल": "l", "व": "w", "स": "s", "ह": "h"
        };

        const uniToRomVowels = {
            "अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo", "ए": "e",
            "ऐ": "ai", "ओ": "o", "औ": "au", "अं": "am", "अः": "ah"
        };

        const uniToRomMatras = {
            "ा": "a", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo", "े": "e", "ै": "ai",
            "ो": "o", "ौ": "au", "ं": "m", "ः": "h"
        };

        let result = "";
        let i = 0;

        while (i < word.length) {
            let matchedCons = null;
            let consLen = 0;
            for (let cKey in uniToRomConsonants) {
                if (word.startsWith(cKey, i)) {
                    if (cKey.length > consLen) {
                        matchedCons = cKey;
                        consLen = cKey.length;
                    }
                }
            }

            if (matchedCons !== null) {
                result += uniToRomConsonants[matchedCons];
                i += consLen;

                if (i < word.length && word.charAt(i) === '्') {
                    i++; // skip halant (half letter)
                } else if (i < word.length && uniToRomMatras[word.charAt(i)]) {
                    result += uniToRomMatras[word.charAt(i)];
                    i++;
                } else if (i < word.length && (uniToRomConsonants[word.charAt(i)] || uniToRomVowels[word.charAt(i)])) {
                    result += "a";
                }
                continue;
            }

            const char = word.charAt(i);
            if (uniToRomVowels[char]) {
                result += uniToRomVowels[char];
                i++;
                continue;
            }

            result += char;
            i++;
        }

        return result;
    }

    /**
     * Converts Roman/English phonetic text to Devanagari Unicode.
     * @param {string} text Roman/English input text
     * @returns {string} Devanagari Unicode text
     */
    static transliterateRomanToUnicode(text) {
        if (!text) return "";

        // Tokenize by word, keeping spaces, punctuation, symbols and newlines intact
        const tokens = text.split(/(\s+|[^\w\']+)/);
        return tokens.map(token => {
            if (/^[a-zA-Z\']+$/.test(token)) {
                return Nepalify.transliterateWord(token);
            }
            return token;
        }).join('');
    }

    /**
     * Intercepts keyboard inputs on a DOM element and converts them to Devanagari based on layout
     * @param {HTMLElement} element The target textarea or input
     * @param {string} layoutName 'romanized', 'traditional', or 'romanize'
     * @returns {object} Control interface { enable, disable }
     */
    static intercept(element, layoutName = 'romanized') {
        if (!element) return null;

        const isInterceptionEnabled = layoutName === 'romanized' || layoutName === 'traditional' || layoutName === 'romanize';

        // Detach existing listeners if present
        if (Nepalify.activeBindings.has(element)) {
            const bindings = Nepalify.activeBindings.get(element);
            if (bindings.keypress) element.removeEventListener('keypress', bindings.keypress);
            if (bindings.keydown) element.removeEventListener('keydown', bindings.keydown);
            if (bindings.click) element.removeEventListener('click', bindings.click);
            if (bindings.focus) element.removeEventListener('focus', bindings.focus);
            if (bindings.input) element.removeEventListener('input', bindings.input);
            if (bindings.paste) element.removeEventListener('paste', bindings.paste);
            Nepalify.activeBindings.delete(element);
        }

        if (!isInterceptionEnabled) {
            return {
                disable: () => {},
                enable: () => {}
            };
        }

        const bindingsObj = {};

        if (layoutName === 'traditional') {
            const layout = Nepalify.traditional;
            const keypressHandler = (e) => {
                if (e.ctrlKey || e.altKey || e.metaKey) return;
                
                const keyChar = e.key;
                if (layout[keyChar]) {
                    e.preventDefault();
                    e.stopPropagation();

                    const start = element.selectionStart;
                    const end = element.selectionEnd;
                    const val = element.value;
                    const replacement = layout[keyChar];

                    element.value = val.substring(0, start) + replacement + val.substring(end);
                    const newCaretPos = start + replacement.length;
                    element.setSelectionRange(newCaretPos, newCaretPos);

                    element.dispatchEvent(new Event('input', { bubbles: true }));
                }
            };

            bindingsObj.keypress = keypressHandler;
        } else if (layoutName === 'romanized') {
            // Phonetic English to Nepali Transliteration (Input-based)
            element._translitState = {
                buffer: "",
                lastLen: 0
            };
            element._lastValue = element.value;

            const inputHandler = (e) => {
                const inputType = e.inputType;
                const start = element.selectionStart;
                const val = element.value;
                const lastVal = element._lastValue || "";
                
                let data = e.data;
                
                // If e.data is null/undefined but value length increased by 1, extract the inserted character
                if (!data && val.length > lastVal.length) {
                    const diffLen = val.length - lastVal.length;
                    if (diffLen === 1) {
                        data = val.charAt(start - 1);
                    }
                }

                // Check for deletion/backspace
                const isDeletion = (inputType === 'deleteContentBackward') || 
                                   (!data && val.length < lastVal.length);

                // Reset buffer on complex operations or non-backspace deletes
                const isComplexDelete = inputType && (inputType.startsWith('delete') && inputType !== 'deleteContentBackward');
                const isUndoRedo = inputType === 'historyUndo' || inputType === 'historyRedo';
                
                if (isComplexDelete || isUndoRedo) {
                    const state = element._translitState;
                    if (state) {
                        state.buffer = "";
                        state.lastLen = 0;
                    }
                    element._lastValue = val;
                    return;
                }

                // Handle backspace delete
                if (isDeletion) {
                    const state = element._translitState;
                    if (state && state.buffer.length > 0) {
                        state.buffer = state.buffer.slice(0, -1);
                        
                        const replacement = Nepalify.transliterateWord(state.buffer);
                        const wordStart = Math.max(0, start - state.lastLen + 1);

                        element.removeEventListener('input', inputHandler);
                        element.value = val.substring(0, wordStart) + replacement + val.substring(start);
                        
                        const newPos = wordStart + replacement.length;
                        element.setSelectionRange(newPos, newPos);
                        state.lastLen = replacement.length;
                        element.addEventListener('input', inputHandler);
                    } else if (state) {
                        state.buffer = "";
                        state.lastLen = 0;
                    }
                    element._lastValue = element.value;
                    return;
                }

                // Ignore paste
                if (inputType === 'insertFromPaste') {
                    element._lastValue = val;
                    return;
                }

                // Handle character insertion
                if (data && /^[a-zA-Z]$/.test(data)) {
                    const state = element._translitState;
                    if (!state) return;
                    
                    state.buffer += data;

                    const replacement = Nepalify.transliterateWord(state.buffer);
                    const wordStart = start - (state.lastLen + 1);
                    
                    element.removeEventListener('input', inputHandler);
                    element.value = val.substring(0, Math.max(0, wordStart)) + replacement + val.substring(start);
                    
                    const newPos = Math.max(0, wordStart) + replacement.length;
                    element.setSelectionRange(newPos, newPos);
                    state.lastLen = replacement.length;
                    element.addEventListener('input', inputHandler);
                } else {
                    // Commit word on spaces/punctuation
                    const state = element._translitState;
                    if (state) {
                        state.buffer = "";
                        state.lastLen = 0;
                    }
                }
                
                element._lastValue = element.value;
            };

            const resetHandler = () => {
                if (element._translitState) {
                    element._translitState.buffer = "";
                    element._translitState.lastLen = 0;
                }
                element._lastValue = element.value;
            };

            const pasteHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();

                const clipboardData = e.clipboardData || window.clipboardData;
                const pastedText = clipboardData.getData('text');
                
                const transliterated = Nepalify.transliterateRomanToUnicode(pastedText);

                const start = element.selectionStart;
                const end = element.selectionEnd;
                const val = element.value;

                element.value = val.substring(0, start) + transliterated + val.substring(end);
                
                const newPos = start + transliterated.length;
                element.setSelectionRange(newPos, newPos);

                element.dispatchEvent(new Event('input', { bubbles: true }));
                
                if (element._translitState) {
                    element._translitState.buffer = "";
                    element._translitState.lastLen = 0;
                }
                element._lastValue = element.value;
            };

            bindingsObj.input = inputHandler;
            bindingsObj.click = resetHandler;
            bindingsObj.focus = resetHandler;
            bindingsObj.paste = pasteHandler;
        } else if (layoutName === 'romanize') {
            // Nepali to English (Romanize / Reverse Transliterate)
            const inputHandler = () => {
                const start = element.selectionStart;
                const val = element.value;

                const replacement = Nepalify.transliterateUnicodeToRoman(val);

                if (replacement !== val) {
                    element.value = replacement;
                    const diff = replacement.length - val.length;
                    const newPos = Math.max(0, start + diff);
                    element.setSelectionRange(newPos, newPos);
                }
            };

            bindingsObj.input = inputHandler;
        }

        const controller = {
            enable: () => {
                if (!Nepalify.activeBindings.has(element)) {
                    if (bindingsObj.keypress) element.addEventListener('keypress', bindingsObj.keypress);
                    if (bindingsObj.keydown) element.addEventListener('keydown', bindingsObj.keydown);
                    if (bindingsObj.click) element.addEventListener('click', bindingsObj.click);
                    if (bindingsObj.focus) element.addEventListener('focus', bindingsObj.focus);
                    if (bindingsObj.input) element.addEventListener('input', bindingsObj.input);
                    if (bindingsObj.paste) element.addEventListener('paste', bindingsObj.paste);
                    
                    Nepalify.activeBindings.set(element, bindingsObj);
                }
            },
            disable: () => {
                if (Nepalify.activeBindings.has(element)) {
                    const bindings = Nepalify.activeBindings.get(element);
                    if (bindings.keypress) element.removeEventListener('keypress', bindings.keypress);
                    if (bindings.keydown) element.removeEventListener('keydown', bindings.keydown);
                    if (bindings.click) element.removeEventListener('click', bindings.click);
                    if (bindings.focus) element.removeEventListener('focus', bindings.focus);
                    if (bindings.input) element.removeEventListener('input', bindings.input);
                    if (bindings.paste) element.removeEventListener('paste', bindings.paste);
                    
                    Nepalify.activeBindings.delete(element);
                    delete element._translitState;
                    delete element._lastValue;
                }
            }
        };

        controller.enable();
        return controller;
    }
}

// Export globally
if (typeof window !== 'undefined') {
    window.Nepalify = Nepalify;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Nepalify;
}
