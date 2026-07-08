/**
 * NepaliLanguageTools - Translator Module
 * Handles English-Nepali and Nepali-English client-side translations.
 */
class NepaliTranslator {
    static async translate(text, sourceLang, targetLang) {
        if (!text || !text.trim()) return "";

        // Check offline status
        if (!navigator.onLine) {
            return "[Offline Mode Active] Cannot connect to translation servers. Please check your internet connection. (Fallback: You can still use our offline English to Nepali typing transliteration tool!)";
        }

        const langPair = `${sourceLang}|${targetLang}`;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Translation service responded with error status.");
            const data = await res.json();
            
            if (data.responseData && data.responseData.translatedText) {
                return data.responseData.translatedText;
            } else {
                return "[Error] Translation lookup returned empty. Please try again.";
            }
        } catch (e) {
            console.error("Translation failed:", e);
            return "[Error] Failed to connect to the translation server. Please try again later.";
        }
    }

    static initTranslator(sourceLang, targetLang, inputId, outputId, submitBtnId, clearBtnId, copyBtnId) {
        const input = document.getElementById(inputId);
        const output = document.getElementById(outputId);
        const submit = document.getElementById(submitBtnId);
        const clear = document.getElementById(clearBtnId);
        const copy = document.getElementById(copyBtnId);

        if (!input || !output) return;

        const handleTranslate = async () => {
            const val = input.value.trim();
            if (!val) {
                output.value = "";
                return;
            }

            output.value = "Translating...";
            if (submit) submit.disabled = true;

            const result = await this.translate(val, sourceLang, targetLang);
            output.value = result;

            if (submit) submit.disabled = false;
        };

        if (submit) {
            submit.addEventListener('click', handleTranslate);
        } else {
            // Debounced auto-translate on input
            let timeout = null;
            input.addEventListener('input', () => {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(handleTranslate, 1000);
            });
        }

        if (clear) {
            clear.addEventListener('click', () => {
                input.value = "";
                output.value = "";
                input.focus();
            });
        }

        if (copy) {
            copy.addEventListener('click', () => {
                if (!output.value) return;
                navigator.clipboard.writeText(output.value)
                    .then(() => window.showToast?.("Translated text copied!"))
                    .catch(e => console.error("Failed to copy:", e));
            });
        }
    }
}

// Bind class globally
window.NepaliTranslator = NepaliTranslator;
