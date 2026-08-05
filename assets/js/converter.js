/**
 * Nepali Font Converter Engine
 * Handles bidirectional translation between legacy fonts (Preeti, Kantipur, etc.) and Unicode.
 */
class NepaliConverter {
    // Legacy font layout symbol list
    static b = ["ç", "˜", ".", "'m", "]m", "Fmf", "Fm", ")", "!", "@", "#", "$", "%", "^", "&", "*", "(", "k|m", "em", "km", "Qm", "qm", "N˜", "¡", "¢", "1", "2", "4", ">", "?", "B", "I", "Q", "ß", "q", "„", "‹", "•", "›", "§", "°", "¶", "¿", "Å", "Ë", "Ì", "Í", "Î", "Ý", "å", "6«", "7«", "8«", "9«", "Ø", "|", "8Þ", "9Þ", "S", "s", "V", "v", "U", "u", "£", "3", "ª", "R", "r", "5", "H", "h", "‰", "´", "~", "`", "6", "7", "8", "9", "0", "T", "t", "Y", "y", "b", "W", "w", "G", "g", "K", "k", "ˆ", "A", "a", "E", "e", "D", "d", "o", "/", "N", "n", "J", "j", "Z", "z", "i", ":", ";", "X", "x", "cf‘", "c‘f", "cf}", "cf]", "cf", "c", "O{", "O", "pm", "p", "C", "P]", "P", "f‘", '"', "'", "+", "f", "[", "\\", "]", "}", "F", "L", "M", "्ा", "्ो", "्ौ", "अो", "अा", "आै", "आे", "ाो", "ाॅ", "ाो", "ंु", "ेे", "अै", "ाो", "अे", "ंा", "अॅ", "ाै", "ैा", "ंृ", "ँा", "ँू", "ेा", "ंे"];
    
    // Corresponding Unicode Devanagari symbol list
    static l = ["ॐ", "ऽ", "।", "m'", "m]", "mfF", "mF", "०", "१", "२", "३", "४", "५", "६", "७", "८", "९", "फ्र", "झ", "फ", "क्त", "क्र", "ल", "ज्ञ्", "द्घ", "ज्ञ", "द्द", "द्ध", "श्र", "रु", "द्य", "क्ष्", "त्त", "द्म", "त्र", "ध्र", "ङ्घ", "ड्ड", "द्र", "ट्ट", "ड्ढ", "ठ्ठ", "रू", "हृ", "ङ्ग", "त्र", "ङ्क", "ङ्ख", "ट्ठ", "द्व", "ट्र", "ठ्र", "ड्र", "ढ्र", "्य", "्र", "ड़", "ढ़", "क्", "क", "ख्", "ख", "ग्", "ग", "घ्", "घ", "ङ", "च्", "च", "छ", "ज्", "ज", "झ्", "झ", "ञ्", "ञ", "ट", "ठ", "ड", "ढ", "ण्", "त्", "त", "थ्", "थ", "द", "ध्", "ध", "न्", "न", "प्", "प", "फ्", "ब्", "ब", "भ्", "भ", "म्", "म", "य", "र", "ल्", "ल", "व्", "व", "श्", "श", "ष्", "स्", "स", "ह्", "ह", "ऑ", "ऑ", "औ", "ओ", "आ", "अ", "ई", "इ", "ऊ", "उ", "ऋ", "ऐ", "ए", "ॉ", "ू", "ु", "ं", "ा", "ृ", "्", "े", "ै", "ँ", "ी", "ः", "", "े", "ै", "ओ", "आ", "औ", "ओ", "ो", "ॉ", "ो", "ुं", "े", "अै", "ो", "अे", "ां", "अॅ", "ौ", "ौ", "ृं", "ाँ", "ूँ", "ो", "ें"];

    // Cached inverted mapping pairs for Unicode-to-Preeti conversion
    static u2pPairs = null;

    /**
     * Converts legacy Preeti font text to standard Unicode (Devanagari)
     * @param {string} legacyText 
     * @returns {string} Unicode text
     */
    static preetiToUnicode(legacyText) {
        if (!legacyText) return "";
        let e = legacyText;

        // Perform standard symbol replacement
        for (let i = 0; i < this.b.length; i++) {
            let k = e.indexOf(this.b[i]);
            while (k !== -1) {
                e = e.replace(this.b[i], this.l[i]);
                k = e.indexOf(this.b[i]);
            }
        }

        // Post-processing: Handle the short 'i' matra (ि) in Preeti (visual order is typed before, Unicode logical order is after)
        let z = e.indexOf("l");
        while (z !== -1) {
            const u = e.charAt(z + 1);
            let y = "l" + u;
            e = e.replace(y, u + "ि");
            z = e.indexOf("l", z + 1);
        }

        // Fix conjunct letters with short 'i' matra (ि)
        let v = e.indexOf("ि्");
        while (v !== -1) {
            const x = e.charAt(v + 2);
            let y = "ि्" + x;
            e = e.replace(y, "्" + x + "ि");
            v = e.indexOf("ि्", v + 2);
        }

        v = e.indexOf("िं्");
        while (v !== -1) {
            const x = e.charAt(v + 3);
            let y = "िं्" + x;
            e = e.replace(y, "्" + x + "िं");
            v = e.indexOf("िं्", v + 3);
        }

        // Post-processing: Handle the half 'r' reph ({) typed after character, goes before in Unicode (र्)
        const set_of_matras = "ा ि ी ु ू ृ े ै ो ौ ं : ँ ॅ";
        let A = e.indexOf("{");
        while (A > 0) {
            let probable_position_of_half_r = A - 1;
            let w = e.charAt(probable_position_of_half_r);
            while (set_of_matras.match(w) !== null) {
                probable_position_of_half_r = probable_position_of_half_r - 1;
                w = e.charAt(probable_position_of_half_r);
            }
            let y = e.substring(probable_position_of_half_r, A);
            const new_replacement_string = "र्" + y;
            y = y + "{";
            e = e.replace(y, new_replacement_string);
            A = e.indexOf("{");
        }

        // Clean up remaining special symbols
        e = e.replace(/=/g, ".");
        e = e.replace(/_/g, ")");
        e = e.replace(/Ö/g, "=");
        e = e.replace(/Ù/g, ";");
        e = e.replace(/…/g, "‘");
        e = e.replace(/Ú/g, "’");
        e = e.replace(/Û/g, "!");
        e = e.replace(/Ü/g, "%");
        e = e.replace(/æ/g, "“");
        e = e.replace(/Æ/g, "”");
        e = e.replace(/±/g, "+");
        e = e.replace(/-/g, "(");
        e = e.replace(/</g, "?");

        return e;
    }

    /**
     * Converts standard Unicode (Devanagari) text back to legacy Preeti font mapping
     * @param {string} unicodeText 
     * @returns {string} Preeti legacy text
     */
    static unicodeToPreeti(unicodeText) {
        if (!unicodeText) return "";
        let text = unicodeText;

        // Initialize inverted mapping pairs sorted by key length descending
        if (this.u2pPairs === null) {
            const pairs = [];
            for (let i = 0; i < this.l.length; i++) {
                const k = this.l[i];
                const v = this.b[i];
                if (k !== "" && k !== undefined) {
                    pairs.push({ key: k, value: v });
                }
            }
            // Sort by Unicode key length descending to replace compound glyphs first
            pairs.sort((x, y) => y.key.length - x.key.length);
            this.u2pPairs = pairs;
        }

        // 1. Reorder reph (र्) - U+0930 + U+094D
        // In Unicode, 'र्' precedes a consonant cluster. In Preeti, it is '{' at the end of the cluster.
        // Cluster regex: (consonant + halant)* + consonant + optional matras (except i, which we process next)
        text = text.replace(/\u0930\u094D((?:[\u0915-\u0939]\u094D)*[\u0915-\u0939][\u093E-\u094C\u0901-\u0903\u093F\u0940]*)/g, "$1{");

        // 2. Reorder short 'i' matra (ि) - U+093F
        // In Unicode, it follows the consonant cluster. In Preeti, 'l' is written before the cluster.
        text = text.replace(/((?:[\u0915-\u0939]\u094D)*[\u0915-\u0939])\u093F/g, "\u093F$1");

        // 3. Map characters using the inverted dictionary
        for (let i = 0; i < this.u2pPairs.length; i++) {
            const pair = this.u2pPairs[i];
            let k = text.indexOf(pair.key);
            while (k !== -1) {
                text = text.replace(pair.key, pair.value);
                k = text.indexOf(pair.key);
            }
        }

        // Apply cleanups for special punctuation and numbers
        text = text.replace(/\./g, "=");
        text = text.replace(/\)/g, "_");
        text = text.replace(/;/g, "Ù");
        text = text.replace(/‘/g, "…");
        text = text.replace(/’/g, "Ú");
        text = text.replace(/\!/g, "Û");
        text = text.replace(/\%/g, "Ü");
        text = text.replace(/“/g, "æ");
        text = text.replace(/”/g, "Æ");
        text = text.replace(/\+/g, "±");
        text = text.replace(/\(/g, "-");
        text = text.replace(/\?/g, "<");

        return text;
    }
}

// Export class globally
if (typeof window !== 'undefined') {
    window.NepaliConverter = NepaliConverter;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NepaliConverter;
}

// UI Event Bindings for Converter Tools
if (typeof window !== 'undefined') {
    document.addEventListener("DOMContentLoaded", () => {
        // --- 1. Real-time Counters ---
        const bindCounters = (textareaId, counterId) => {
            const textarea = document.getElementById(textareaId);
            const counter = document.getElementById(counterId);
            if (!textarea || !counter) return;

            const updateCount = () => {
                const text = textarea.value;
                const chars = text.length;
                // Simple word count: split by whitespace, filter out empty strings
                const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
                counter.textContent = `${chars} chars | ${words} words`;
            };

            // Bind events
            textarea.addEventListener("input", updateCount);
            // Initial call
            updateCount();
        };

        // Try binding common IDs (some pages use different IDs, but we will standardize)
        bindCounters("preeti-input", "preeti-count");
        bindCounters("unicode-output", "unicode-count");
        bindCounters("source-input", "source-count");
        bindCounters("target-output", "target-count");


        // --- 2. Copy to Clipboard ---
        const bindCopy = (buttonId, textareaId) => {
            const btn = document.getElementById(buttonId);
            const textarea = document.getElementById(textareaId);
            if (!btn || !textarea) return;

            btn.addEventListener("click", () => {
                if (!textarea.value) return;
                
                // Modern Clipboard API
                navigator.clipboard.writeText(textarea.value).then(() => {
                    const originalText = btn.textContent;
                    btn.textContent = "Copied! ✅";
                    btn.style.backgroundColor = "var(--success-color, #2e7d32)";
                    
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.backgroundColor = ""; // revert to CSS original
                    }, 2000);
                }).catch(err => {
                    console.error("Failed to copy text: ", err);
                    alert("Failed to copy to clipboard.");
                });
            });
        };

        bindCopy("preeti-copy", "unicode-output");
        bindCopy("unicode-copy", "preeti-output"); // In unicode-to-preeti, output is preeti
        bindCopy("typing-copy", "unicode-output");
        bindCopy("trans-copy", "target-output");
        bindCopy("docs-copy", "unicode-output");

        // --- 3. Download as .txt ---
        const bindDownload = (buttonId, textareaId, defaultFileName) => {
            const btn = document.getElementById(buttonId);
            const textarea = document.getElementById(textareaId);
            if (!btn || !textarea) return;

            btn.addEventListener("click", () => {
                if (!textarea.value) return;
                
                const blob = new Blob([textarea.value], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = defaultFileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        };

        // Download button bindings
        bindDownload("preeti-download", "unicode-output", "unicode_text.txt");
        bindDownload("unicode-download", "preeti-output", "preeti_text.txt");
        bindDownload("typing-download", "unicode-output", "typed_text.txt");
        bindDownload("trans-download", "target-output", "translated_text.txt");
        bindDownload("docs-download", "unicode-output", "nepali_document.txt");
        
        // --- 4. Clear Button ---
        const bindClear = (buttonId, inputId, outputId) => {
            const btn = document.getElementById(buttonId);
            const input = document.getElementById(inputId);
            const output = document.getElementById(outputId);
            
            if (!btn || !input) return;
            
            btn.addEventListener("click", () => {
                input.value = "";
                if (output) output.value = "";
                // trigger input event to update counters
                input.dispatchEvent(new Event("input"));
                if (output) output.dispatchEvent(new Event("input"));
                input.focus();
            });
        };
        
        bindClear("preeti-clear", "preeti-input", "unicode-output");
        bindClear("unicode-clear", "unicode-input", "preeti-output");
        bindClear("typing-clear", "roman-input", "unicode-output");
        bindClear("trans-clear", "source-input", "target-output");
        bindClear("docs-clear", "docs-input", "unicode-output");
    });
}

