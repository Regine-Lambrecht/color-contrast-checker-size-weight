document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Coloris ---
    Coloris({
        el: '[data-coloris]',
        themeMode: 'light',
        alpha: true,
        swatches: [],
        format: 'auto', // MODIFIED: Format will now match the user's current mode
        formatToggle: true,
        onChange: (color, input) => {
            input.value = color;
            checkContrast(fgColorText.value, bgColorText.value);
        }
    });

    // --- DOM Element References ---
    const fontSizeSelect = document.getElementById('font-size');
    const fontWeightSelect = document.getElementById('font-weight');
    const fgColorText = document.getElementById('fg-color-text');
    const bgColorText = document.getElementById('bg-color-text');
    const resultsContainer = document.querySelector('.results-container');
    const noTextCheckbox = document.getElementById('no-text-checkbox');
    const contrastRatioSpan = document.getElementById('contrast-ratio');
    const neededRatioSpan = document.getElementById('needed-ratio');
    const aaOverallStatusSpan = document.getElementById('aa-overall-status');
    const aaTextTypeSpan = document.getElementById('aa-text-type');
    const suggestionsContainer = document.querySelector('.suggestions-container');
    const fontSuggestion = document.getElementById('font-suggestion');
    const fontSuggestionDetails = document.getElementById('font-suggestion-details');
    
    // MODIFIED: Make these 'let' so they can be re-selected
    let c1SuggestionWrapper = document.getElementById('c1-suggestion-wrapper');
    let c1SuggestionSwatch = document.getElementById('suggestion-c1-swatch');
    let c1SuggestionDetails = document.getElementById('c1-suggestion-details');
    let c1SuggestionHslRatio = document.getElementById('c1-suggestion-hsl-ratio');
    let c1SuggestionRgbRatio = document.getElementById('c1-suggestion-rgb-ratio');
    let c2SuggestionWrapper = document.getElementById('c2-suggestion-wrapper');
    let c2SuggestionSwatch = document.getElementById('suggestion-c2-swatch');
    let c2SuggestionDetails = document.getElementById('c2-suggestion-details');
    let c2SuggestionHslRatio = document.getElementById('c2-suggestion-hsl-ratio');
    let c2SuggestionRgbRatio = document.getElementById('c2-suggestion-rgb-ratio');

    // --- Add class on click to hide/show slider ---
    fgColorText.addEventListener('mousedown', () => {
        document.body.classList.remove('bg-picker-active');
    });
    
    bgColorText.addEventListener('mousedown', () => {
        document.body.classList.add('bg-picker-active');
    });
    // --- End of slider logic ---

    // --- Event Listeners ---
    const triggerCheck = () => checkContrast(fgColorText.value, bgColorText.value);

    document.querySelectorAll('input[name="font-size-unit"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateFontSizeOptions();
            triggerCheck();
        });
    });
    fontSizeSelect.addEventListener('change', triggerCheck);
    fontWeightSelect.addEventListener('change', triggerCheck);
    noTextCheckbox.addEventListener('change', triggerCheck);

    const formatHexOnBlur = (e) => {
        // MODIFIED: Don't format if it's not a hex value
        if (e.target.value.startsWith('rgb') || e.target.value.startsWith('hsl')) {
            triggerCheck();
            return;
        }
        const formattedHex = formatHex(e.target.value);
        e.target.value = formattedHex;
        triggerCheck();
    };
    fgColorText.addEventListener('blur', formatHexOnBlur);
    bgColorText.addEventListener('blur', formatHexOnBlur);

    // --- Initial Setup ---
    updateFontSizeOptions();
    // MODIFIED: Set default values before first check
    fgColorText.value = '#5a6474';
    bgColorText.value = '#ffffff';
    triggerCheck();

    // --- Main Functions ---
    function updateFontSizeOptions() {
        const unit = document.querySelector('input[name="font-size-unit"]:checked').value;
        const currentVal = fontSizeSelect.value;
        fontSizeSelect.innerHTML = '';

        let options;
        if (unit === 'pt') {
            options = [
                { value: 12, text: '< 14' }, { value: 14, text: '14' },
                { value: 14.5, text: '14.5' }, { value: 15, text: '15' },
                { value: 15.5, text: '15.5' }, { value: 16, text: '16' },
                { value: 17, text: '17' }, { value: 17.5, text: '17.5' },
                { value: 18, text: '18' }, { value: 24, text: '> 18' }
            ];
        } else { // px
             options = [
                { value: 16, text: '16' }, { value: 18, text: '< 18.5' },
                { value: 18.5, text: '18.5' }, { value: 19, text: '19' },
                { value: 19.5, text: '19.5' }, { value: 20, text: '20' },
                { value: 20.5, text: '20.5' }, { value: 21, text: '21' },
                { value: 21.5, text: '21.5' }, { value: 22, text: '22' },
                { value: 22.5, text: '22.5' }, { value: 23, text: '23' },
                { value: 23.5, text: '23.5' }, { value: 24, text: '≥ 24' }
            ];
        }
        
        const defaultValue = (unit === 'pt') ? '12' : '16';
        
        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.text;
            fontSizeSelect.appendChild(optionEl);
        });
        
        const potentialOption = options.find(o => o.value == currentVal);
        fontSizeSelect.value = potentialOption ? currentVal : defaultValue;
    }
    
    // MODIFIED: checkContrast now handles alpha
    function checkContrast(fgColor, bgColor) {
        const isNonText = noTextCheckbox.checked;
        
        const fgParsed = parseColorToRgb(fgColor);
        const bgParsed = parseColorToRgb(bgColor);

        if (!fgParsed || !bgParsed) {
            suggestionsContainer.style.display = 'none';
            contrastRatioSpan.textContent = '-';
            neededRatioSpan.textContent = '-';
            updateStatus(aaOverallStatusSpan, false);
            aaOverallStatusSpan.textContent = 'FAIL';
            aaTextTypeSpan.textContent = '(Invalid colour)';
            return;
        }
        
        // --- NEW: Alpha Handling ---
        let fgRgb, bgRgb;
        
        if (bgParsed.a < 1) {
            // Cannot calculate contrast with a transparent background
            suggestionsContainer.style.display = 'none';
            contrastRatioSpan.textContent = 'N/A';
            neededRatioSpan.textContent = '-';
            updateStatus(aaOverallStatusSpan, false);
            aaOverallStatusSpan.textContent = 'FAIL';
            aaTextTypeSpan.textContent = '(BG must be opaque)';
            return;
        } else {
            bgRgb = bgParsed; // bg is opaque, good to go.
        }

        if (fgParsed.a < 1) {
            // Flatten foreground against the opaque background
            fgRgb = flattenColor(fgParsed, bgRgb);
        } else {
            fgRgb = fgParsed; // fg is opaque, good to go.
        }
        // --- END: Alpha Handling ---

        const ratio = getContrastRatio(fgRgb, bgRgb);
        contrastRatioSpan.textContent = ratio.toFixed(2);

        let neededRatio;
        let aaPass;
        let isLargeText = false;

        if (isNonText) {
            neededRatio = 3.0;
            aaTextTypeSpan.textContent = `(Graphics/UI)`;
        } else {
            let fontSize = parseFloat(fontSizeSelect.value);
            const fontSizeUnit = document.querySelector('input[name="font-size-unit"]:checked').value;
            const fontWeight = parseInt(fontWeightSelect.value, 10);
            let fontSizePx = (fontSizeUnit === 'pt') ? fontSize * 1.3333 : fontSize;
            isLargeText = (fontSizePx >= 24) || (fontSizePx >= 18.66 && fontWeight >= 700);
            neededRatio = isLargeText ? 3.0 : 4.5;
            aaTextTypeSpan.textContent = `(${isLargeText ? 'Large text' : 'Normal text'})`;
        }

        neededRatioSpan.textContent = neededRatio.toFixed(2);
        aaPass = ratio >= neededRatio;
        updateStatus(aaOverallStatusSpan, aaPass);

        if (aaPass) {
            suggestionsContainer.style.display = 'none';
        } else {
            suggestionsContainer.style.display = 'flex';
            
            // --- NEW: Clear old listeners by replacing nodes ---
            c1SuggestionWrapper.replaceWith(c1SuggestionWrapper.cloneNode(true));
            c2SuggestionWrapper.replaceWith(c2SuggestionWrapper.cloneNode(true));
            
            // --- NEW: Re-select the new nodes ---
            c1SuggestionWrapper = document.getElementById('c1-suggestion-wrapper');
            c1SuggestionSwatch = document.getElementById('suggestion-c1-swatch');
            c1SuggestionDetails = document.getElementById('c1-suggestion-details');
            c1SuggestionHslRatio = document.getElementById('c1-suggestion-hsl-ratio');
            c1SuggestionRgbRatio = document.getElementById('c1-suggestion-rgb-ratio');
            c2SuggestionWrapper = document.getElementById('c2-suggestion-wrapper');
            c2SuggestionSwatch = document.getElementById('suggestion-c2-swatch');
            c2SuggestionDetails = document.getElementById('c2-suggestion-details');
            c2SuggestionHslRatio = document.getElementById('c2-suggestion-hsl-ratio');
            c2SuggestionRgbRatio = document.getElementById('c2-suggestion-rgb-ratio');
            // --- End of new re-selection ---

            fontSuggestion.style.display = 'none';
            c1SuggestionWrapper.style.display = 'none';
            c2SuggestionWrapper.style.display = 'none';

            let firstSuggestionShown = false;

            // --- FONT SUGGESTION LOGIC (UNCHANGED) ---
            const canPassAsLarge = ratio >= 3.0;
            if (!isNonText && !isLargeText && canPassAsLarge) {
                fontSuggestion.style.display = 'flex';
                const fontSizeUnit = document.querySelector('input[name="font-size-unit"]:checked').value;
                let suggestionText = `Enlarge text: min `;
                suggestionText += (fontSizeUnit === 'pt') ? `14pt bold or 18pt non bold` : `18.66px bold or 24px non bold`;
                fontSuggestionDetails.textContent = suggestionText;
                firstSuggestionShown = true;
            }
            // --- END OF FONT SUGGESTION LOGIC ---

            // --- Define the Font Awesome icon HTML ---
            const copyIconSvg = `<i class="copy-icon fa-solid fa-copy" aria-hidden="true"></i>`;

            const suggestedFgResult = findPassingColor(fgRgb, bgRgb, neededRatio);
            if (suggestedFgResult && suggestedFgResult.hex.toLowerCase() !== rgbToHex(fgRgb).toLowerCase()) {
                c1SuggestionWrapper.style.display = 'flex';
                c1SuggestionSwatch.style.backgroundColor = suggestedFgResult.hex;

                const prefix = firstSuggestionShown ? 'Or replace' : 'Replace';
                // MODIFIED: Add text span and icon
                c1SuggestionDetails.innerHTML = `<span class="suggestion-text">${prefix} Colour 1 with <span class="suggestion-hex">${suggestedFgResult.hex}</span></span>${copyIconSvg}`;

                // --- NEW: Add Accessibility & Click Listeners ---
                c1SuggestionDetails.setAttribute('role', 'button');
                c1SuggestionDetails.setAttribute('tabindex', '0');
                const copyFunc1 = () => copyToClipboard(suggestedFgResult.hex, c1SuggestionDetails);
                c1SuggestionDetails.addEventListener('click', copyFunc1);
                c1SuggestionDetails.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault(); // Stop spacebar from scrolling
                        copyFunc1();
                    }
                });
                // --- End of new listeners ---

                const finalRatio = getContrastRatio(parseColorToRgb(suggestedFgResult.hex), bgRgb);
                c1SuggestionHslRatio.textContent = `HSL true ratio: ${suggestedFgResult.perfectRatio.toFixed(2)}`;
                c1SuggestionRgbRatio.textContent = `(RGB converted ratio: ${finalRatio.toFixed(2)})`;

                firstSuggestionShown = true;
            }

            const suggestedBgResult = findPassingColor(bgRgb, fgRgb, neededRatio);
            if (suggestedBgResult && suggestedBgResult.hex.toLowerCase() !== rgbToHex(bgRgb).toLowerCase()) {
                c2SuggestionWrapper.style.display = 'flex';
                c2SuggestionSwatch.style.backgroundColor = suggestedBgResult.hex;

                const prefix = firstSuggestionShown ? 'Or replace' : 'Replace';
                // MODIFIED: Add text span and icon
                c2SuggestionDetails.innerHTML = `<span class="suggestion-text">${prefix} Colour 2 with <span class="suggestion-hex">${suggestedBgResult.hex}</span></span>${copyIconSvg}`;
                
                // --- NEW: Add Accessibility & Click Listeners ---
                c2SuggestionDetails.setAttribute('role', 'button');
                c2SuggestionDetails.setAttribute('tabindex', '0');
                const copyFunc2 = () => copyToClipboard(suggestedBgResult.hex, c2SuggestionDetails);
                c2SuggestionDetails.addEventListener('click', copyFunc2);
                c2SuggestionDetails.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault(); // Stop spacebar from scrolling
                        copyFunc2();
                    }
                });
                // --- End of new listeners ---

                const finalRatio = getContrastRatio(fgRgb, parseColorToRgb(suggestedBgResult.hex));
                c2SuggestionHslRatio.textContent = `HSL true ratio: ${suggestedBgResult.perfectRatio.toFixed(2)}`;
                c2SuggestionRgbRatio.textContent = `(RGB converted ratio: ${finalRatio.toFixed(2)})`;
            }
        }
    }

    // --- Helper Functions ---
    function updateStatus(element, passes) {
        element.textContent = passes ? 'PASS' : 'FAIL';
        element.classList.toggle('pass', passes);
        element.classList.toggle('fail', !passes);
    }

    function getLuminance(rgb) {
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    function getContrastRatio(rgb1, rgb2) {
        const lum1 = getLuminance(rgb1);
        const lum2 = getLuminance(rgb2);
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    // MODIFIED: Now handles 4/8 digit hex
    function formatHex(hex) {
        if (!hex) return '';
        hex = hex.trim();
        
        // Shorthand 3 or 4 digit (#RGB or #RGBA)
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i;
        if (shorthandRegex.test(hex)) {
            return hex.replace(shorthandRegex, (m, r, g, b, a) => {
                a = a !== undefined ? `${a}${a}` : '';
                return `#${r}${r}${g}${g}${b}${b}${a}`;
            });
        }

        // Handle 6 or 8-digit without hash
        if (/^#?[a-f\d]{6}([a-f\d]{2})?$/i.test(hex) && !hex.startsWith('#')) {
            return `#${hex}`;
        }
        
        return hex;
    }
    
    // MODIFIED: This function now parses Hex, RGB(A), and HSL(A) and returns ALPHA
    function parseColorToRgb(colorString) {
        if (!colorString) return null;
        colorString = colorString.trim();

        // Try to parse as RGB/RGBA
        let rgbMatch = colorString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d\.]+))?\)$/);
        if (rgbMatch) {
            return {
                r: parseInt(rgbMatch[1], 10),
                g: parseInt(rgbMatch[2], 10),
                b: parseInt(rgbMatch[3], 10),
                a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1.0 // Keep alpha
            };
        }

        // Try to parse as HSL/HSLA
        let hslMatch = colorString.match(/^hsla?\((\d+),\s*([\d\.]+)%?,\s*([\d\.]+)%?(?:,\s*([\d\.]+))?\)$/);
        if (hslMatch) {
            const h = parseInt(hslMatch[1], 10) / 360;
            const s = parseFloat(hslMatch[2]) / 100;
            const l = parseFloat(hslMatch[3]) / 100;
            const a = hslMatch[4] !== undefined ? parseFloat(hslMatch[4]) : 1.0; // Keep alpha
            const rgb = hslToRgb({ h, s, l });
            return { ...rgb, a: a }; // Add alpha to result
        }

        // Try to parse as Hex (3, 4, 6, or 8 digits)
        const fullHex = formatHex(colorString); // Use formatter to handle shorthand
        let hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(fullHex);
        if (hexMatch) {
            return {
                r: parseInt(hexMatch[1], 16),
                g: parseInt(hexMatch[2], 16),
                b: parseInt(hexMatch[3], 16),
                a: hexMatch[4] !== undefined ? (parseInt(hexMatch[4], 16) / 255) : 1.0 // Keep alpha
            };
        }
        
        return null;
    }

    // --- NEW HELPER FUNCTIONS ---

    /**
     * NEW: Flattens a transparent foreground color onto an opaque background color.
     */
    function flattenColor(fgRgbA, bgRgb) {
        const alpha = fgRgbA.a;
        return {
            r: Math.round(alpha * fgRgbA.r + (1 - alpha) * bgRgb.r),
            g: Math.round(alpha * fgRgbA.g + (1 - alpha) * bgRgb.g),
            b: Math.round(alpha * fgRgbA.b + (1 - alpha) * bgRgb.b)
            // No 'a' property, as the new color is opaque
        };
    }

    /**
     * MODIFIED: Copies text to the clipboard and shows a temporary message.
     */
    function copyToClipboard(text, element) {
        // 'element' is the .suggestion-details div
        if (element.classList.contains('copy-busy')) { // NEW check
            return; // Don't do anything if already copying
        }
        element.classList.add('copy-busy'); // NEW state
        
        const textSpan = element.querySelector('.suggestion-text'); // Find the text span
        if (!textSpan) return; // Safety check

        const originalTextHTML = textSpan.innerHTML; // Store original HTML
        
        navigator.clipboard.writeText(text).then(() => {
            textSpan.textContent = `Copied ${text}!`; // Use textContent for plain text
            element.style.cursor = 'default';
            
            setTimeout(() => {
                textSpan.innerHTML = originalTextHTML; // Restore original HTML
                element.style.cursor = 'pointer';
                element.classList.remove('copy-busy'); // NEW: Remove state
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy: ', err); // Log the error
            textSpan.textContent = 'Failed to copy'; // Use textContent
            setTimeout(() => {
                textSpan.innerHTML = originalTextHTML; // Restore original HTML
                element.classList.remove('copy-busy'); // NEW: Remove state
            }, 1500);
        });
    }

    // --- END NEW HELPER FUNCTIONS ---


    function rgbToHex(rgb) {
        if (!rgb) return '#000000';
        return "#" + [rgb.r, rgb.g, rgb.b].map(c => {
            const hex = Math.round(c).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    function rgbToHsl(rgb) {
        if (!rgb) return { h: 0, s: 0, l: 0 };
        let { r, g, b } = rgb; r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h, s, l };
    }

    function hslToRgb(hsl) {
        let { h, s, l } = hsl; let r, g, b;
        if (s === 0) { r = g = b = l; }
        else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1; if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }
    
    function findPassingColor(colorToChange, otherColor, targetRatio) {
        const otherLuminance = getLuminance(otherColor);
        const colorHsl = rgbToHsl(colorToChange);
        let direction = (otherLuminance > 0.5) ? -1 : 1;
    
        let min = 0, max = 1;
        if (direction === -1) { max = colorHsl.l; } 
        else { min = colorHsl.l; }
    
        let bestPassingLightness = null;
    
        for (let i = 0; i < 30; i++) {
            let mid = (min + max) / 2;
            let currentHsl = { ...colorHsl, l: mid };
            if (getContrastRatio(hslToRgb(currentHsl), otherColor) >= targetRatio) {
                bestPassingLightness = mid;
                if (direction === 1) { max = mid; } else { min = mid; }
            } else {
                if (direction === 1) { min = mid; } else { max = mid; }
            }
        }
    
        if (bestPassingLightness === null) {
            direction *= -1;
            min = 0; max = 1;
            if (direction === -1) { max = colorHsl.l; } else { min = colorHsl.l; }
            for (let i = 0; i < 30; i++) {
                 let mid = (min + max) / 2;
                 let currentHsl = { ...colorHsl, l: mid };
                 if (getContrastRatio(hslToRgb(currentHsl), otherColor) >= targetRatio) {
                     bestPassingLightness = mid;
                     if (direction === 1) { max = mid; } else { min = mid; }
                 } else {
                     if (direction === 1) { min = mid; } else { max = mid; }
                 }
            }
        }
    
        if (bestPassingLightness === null) {
            return null;
        }
    
        let finalHsl = { ...colorHsl, l: bestPassingLightness };
        
        let finalRatio = getContrastRatio(hslToRgb(finalHsl), otherColor);
        let iterations = 0;
        
        while (finalRatio < targetRatio && iterations < 100) {
            finalHsl.l += (direction * 0.0001);
            if (finalHsl.l < 0 || finalHsl.l > 1) {
                return null;
            }
            finalRatio = getContrastRatio(hslToRgb(finalHsl), otherColor);
            iterations++;
        }
        
        if (finalRatio < targetRatio) {
            return null;
        }
        
        const perfectRatio = getContrastRatio(hslToRgb(finalHsl), otherColor);
        const finalHex = rgbToHex(hslToRgb(finalHsl));

        return { hex: finalHex, perfectRatio: perfectRatio };
    }
});