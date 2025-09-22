document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const fontSizeSelect = document.getElementById('font-size');
    const fontWeightSelect = document.getElementById('font-weight');
    const fgColorPicker = document.getElementById('fg-color-picker');
    const fgColorText = document.getElementById('fg-color-text');
    const bgColorPicker = document.getElementById('bg-color-picker');
    const bgColorText = document.getElementById('bg-color-text');
    const checkContrastBtn = document.getElementById('check-contrast-btn');
    const checkStatusMessage = document.getElementById('check-status-message');
    const resultsContainer = document.querySelector('.results-container');
    
    // WCAG AA Result Elements
    const contrastRatioSpan = document.getElementById('contrast-ratio');
    const neededRatioSpan = document.getElementById('needed-ratio');
    const aaOverallStatusSpan = document.getElementById('aa-overall-status');
    const aaTextTypeSpan = document.getElementById('aa-text-type');

    // Suggestion Elements
    const suggestionsContainer = document.querySelector('.suggestions-container');
    const fontSuggestion = document.getElementById('font-suggestion');
    const fontSuggestionDetails = document.getElementById('font-suggestion-details');
    const c1SuggestionWrapper = document.getElementById('c1-suggestion-wrapper');
    const c2SuggestionWrapper = document.getElementById('c2-suggestion-wrapper');
    const suggestionC1Prefix = document.getElementById('suggestion-c1-prefix');
    const suggestionC2Prefix = document.getElementById('suggestion-c2-prefix');
    const suggestionC1Swatch = document.getElementById('suggestion-c1-swatch');
    const suggestionC1Hex = document.getElementById('suggestion-c1-hex');
    const suggestionC1Ratio = document.getElementById('suggestion-c1-ratio');
    const suggestionC2Swatch = document.getElementById('suggestion-c2-swatch');
    const suggestionC2Hex = document.getElementById('suggestion-c2-hex');
    const suggestionC2Ratio = document.getElementById('suggestion-c2-ratio');

    // --- Event Listeners ---
    fgColorPicker.addEventListener('input', () => { fgColorText.value = fgColorPicker.value; showButton(); });
    fgColorText.addEventListener('input', () => { fgColorPicker.value = fgColorText.value; showButton(); });
    bgColorPicker.addEventListener('input', () => { bgColorText.value = bgColorPicker.value; showButton(); });
    bgColorText.addEventListener('input', () => { bgColorPicker.value = bgColorText.value; showButton(); });
    
    checkContrastBtn.addEventListener('click', checkContrast);
    document.querySelectorAll('input[name="font-size-unit"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateFontSizeOptions();
            showButton();
        });
    });
    fontSizeSelect.addEventListener('change', showButton);
    fontWeightSelect.addEventListener('change', showButton);


    // --- Initial Setup ---
    updateFontSizeOptions();
    checkContrast();

    // --- Main Functions ---
    function updateFontSizeOptions() {
        const unit = document.querySelector('input[name="font-size-unit"]:checked').value;
        const currentVal = fontSizeSelect.value;
        fontSizeSelect.innerHTML = ''; // Clear existing options

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

    function showButton() {
        checkContrastBtn.style.display = 'block';
        checkStatusMessage.style.display = 'none';
        resultsContainer.style.display = 'none';
        suggestionsContainer.style.display = 'none';
    }

    function checkContrast() {
        // Get inputs
        let fontSize = parseFloat(fontSizeSelect.value);
        const fontSizeUnit = document.querySelector('input[name="font-size-unit"]:checked').value;
        const fontWeight = parseInt(fontWeightSelect.value, 10);
        const fgColorHex = fgColorText.value;
        const bgColorHex = bgColorText.value;
        
        let fontSizePx = (fontSizeUnit === 'pt') ? fontSize * 1.3333 : fontSize;

        const fgRgb = hexToRgb(fgColorHex);
        const bgRgb = hexToRgb(bgColorHex);

        if (!fgRgb || !bgRgb) return;

        const ratio = getContrastRatio(fgRgb, bgRgb);
        contrastRatioSpan.textContent = ratio.toFixed(2);

        const isLargeText = (fontSizePx >= 24) || (fontSizePx >= 18.66 && fontWeight >= 700);
        const neededRatio = isLargeText ? 3.0 : 4.5;
        neededRatioSpan.textContent = neededRatio;
        
        aaTextTypeSpan.textContent = `(${isLargeText ? 'Large text' : 'Normal text'})`;

        const aaPass = ratio >= neededRatio;
        updateStatus(aaOverallStatusSpan, aaPass);

        checkContrastBtn.style.display = 'none';
        checkStatusMessage.style.display = 'block';
        checkStatusMessage.classList.remove('pass', 'fail');

        if (aaPass) {
            checkStatusMessage.textContent = 'Your contrast is ok';
            checkStatusMessage.classList.add('pass');
            suggestionsContainer.style.display = 'none';
        } else {
            checkStatusMessage.textContent = 'Your contrast is not ok';
            checkStatusMessage.classList.add('fail');
            suggestionsContainer.style.display = 'flex';
            
            // Hide all suggestions initially
            fontSuggestion.style.display = 'none';
            c1SuggestionWrapper.style.display = 'none';
            c2SuggestionWrapper.style.display = 'none';

            let firstSuggestionShown = false;

            // Font suggestion logic
            const canPassAsLarge = ratio >= 3.0;
            if (!isLargeText && canPassAsLarge) {
                fontSuggestion.style.display = 'flex';
                let suggestionText = `Enlarge text: min `;
                suggestionText += (fontSizeUnit === 'pt') ? `14pt bold or 18pt non bold` : `18.66px bold or 24px non bold`;
                fontSuggestionDetails.textContent = suggestionText;
                firstSuggestionShown = true;
            }

            // Color suggestion logic
            const suggestedFg = findPassingColor(fgRgb, bgRgb, neededRatio);
            if (suggestedFg && suggestedFg.toLowerCase() !== fgColorHex.toLowerCase()) {
                c1SuggestionWrapper.style.display = 'flex';
                suggestionC1Prefix.textContent = firstSuggestionShown ? 'Or replace' : 'Replace';
                suggestionC1Swatch.style.backgroundColor = suggestedFg;
                suggestionC1Hex.textContent = suggestedFg;
                suggestionC1Ratio.textContent = getContrastRatio(hexToRgb(suggestedFg), bgRgb).toFixed(2);
                firstSuggestionShown = true;
            }

            const suggestedBg = findPassingColor(bgRgb, fgRgb, neededRatio);
            if (suggestedBg && suggestedBg.toLowerCase() !== bgColorHex.toLowerCase()) {
                c2SuggestionWrapper.style.display = 'flex';
                suggestionC2Prefix.textContent = firstSuggestionShown ? 'Or replace' : 'Replace';
                suggestionC2Swatch.style.backgroundColor = suggestedBg;
                suggestionC2Hex.textContent = suggestedBg;
                suggestionC2Ratio.textContent = getContrastRatio(fgRgb, hexToRgb(suggestedBg)).toFixed(2);
            }
        }

        resultsContainer.style.display = 'block';
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

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function rgbToHex(rgb) {
        return "#" + [rgb.r, rgb.g, rgb.b].map(c => {
            const hex = Math.round(c).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    function rgbToHsl(rgb) {
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
        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    function findPassingColor(colorToChange, otherColor, targetRatio) {
        const otherLuminance = getLuminance(otherColor);
        const colorHsl = rgbToHsl(colorToChange);
        let direction = (otherLuminance > 0.5) ? -1 : 1; // -1 to darken, 1 to lighten

        let min = 0, max = 1;
        if (direction === -1) { max = colorHsl.l; } 
        else { min = colorHsl.l; }

        let bestPassingLightness = null;

        // Binary search to find a lightness that passes the target
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
        
        // If search fails, try the other direction (for mid-grey otherColor)
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
            return null; // No solution found
        }

        let finalHsl = { ...colorHsl, l: bestPassingLightness };
        
        // --- NEW ROBUSTNESS CHECK ---
        // After finding the best candidate, check its *actual* unrounded ratio.
        // If it's still below target due to floating point issues, nudge it until it passes.
        let finalRatio = getContrastRatio(hslToRgb(finalHsl), otherColor);
        let iterations = 0;
        while (finalRatio < targetRatio && iterations < 100) {
            finalHsl.l += (direction * 0.0001); // Nudge lightness slightly
            if (finalHsl.l < 0 || finalHsl.l > 1) {
                return null; // Stop if we go out of bounds
            }
            finalRatio = getContrastRatio(hslToRgb(finalHsl), otherColor);
            iterations++;
        }

        // If, after all that, it still fails, there is no valid solution.
        if (finalRatio < targetRatio) {
            return null;
        }

        return rgbToHex(hslToRgb(finalHsl));
    }
});

