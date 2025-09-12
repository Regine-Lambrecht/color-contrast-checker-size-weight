document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const fontSizeSelect = document.getElementById('font-size');
    const fontSizeUnitSelect = document.getElementById('font-size-unit');
    const fontWeightSelect = document.getElementById('font-weight');
    const fgColorPicker = document.getElementById('fg-color-picker');
    const fgColorText = document.getElementById('fg-color-text');
    const bgColorPicker = document.getElementById('bg-color-picker');
    const bgColorText = document.getElementById('bg-color-text');
    const checkContrastBtn = document.getElementById('check-contrast-btn');
    const checkStatusMessage = document.getElementById('check-status-message');
    const contrastRatioSpan = document.getElementById('contrast-ratio');
    const neededRatioSpan = document.getElementById('needed-ratio');
    
    // WCAG AA Result Elements
    const aaOverallStatusSpan = document.getElementById('aa-overall-status');
    const aaTextTypeSpan = document.getElementById('aa-text-type');

    // Suggestion Elements
    const suggestionsWrapper = document.getElementById('suggestions-wrapper');
    const suggestionC1Swatch = document.getElementById('suggestion-c1-swatch');
    const suggestionC1Hex = document.getElementById('suggestion-c1-hex');
    const suggestionC1Ratio = document.getElementById('suggestion-c1-ratio');
    const suggestionC2Swatch = document.getElementById('suggestion-c2-swatch');
    const suggestionC2Hex = document.getElementById('suggestion-c2-hex');
    const suggestionC2Ratio = document.getElementById('suggestion-c2-ratio');

    // --- Event Listeners ---
    fgColorPicker.addEventListener('input', () => fgColorText.value = fgColorPicker.value);
    fgColorText.addEventListener('input', () => fgColorPicker.value = fgColorText.value);
    bgColorPicker.addEventListener('input', () => bgColorText.value = bgColorPicker.value);
    bgColorText.addEventListener('input', () => bgColorPicker.value = bgColorText.value);
    checkContrastBtn.addEventListener('click', checkContrast);
    fontSizeUnitSelect.addEventListener('change', updateFontSizeOptions);


    // Listen for any input change to show the button again
    const allInputs = [
        fontSizeSelect, fontSizeUnitSelect, 
        fontWeightSelect, fgColorPicker, fgColorText, bgColorPicker, bgColorText
    ];
    allInputs.forEach(input => {
        const eventType = input.tagName.toLowerCase() === 'select' ? 'change' : 'input';
        input.addEventListener(eventType, showButton);
    });

    // --- Initial Setup ---
    updateFontSizeOptions();
    checkContrast();

    // --- Main Functions ---

    function updateFontSizeOptions() {
        const unit = fontSizeUnitSelect.value;
        fontSizeSelect.innerHTML = ''; // Clear existing options

        let options;
        if (unit === 'pt') {
            options = [
                { value: 12, text: '< 14' },
                { value: 14, text: '14' },
                { value: 14.5, text: '14.5' },
                { value: 15, text: '15' },
                { value: 15.5, text: '15.5' },
                { value: 16, text: '16' },
                { value: 17, text: '17' },
                { value: 17.5, text: '17.5' },
                { value: 18, text: '18' },
                { value: 24, text: '> 18' }
            ];
        } else { // px
             options = [
                { value: 18, text: '< 18.5' },
                { value: 18.5, text: '18.5' },
                { value: 19, text: '19' },
                { value: 19.5, text: '19.5' },
                { value: 20, text: '20' },
                { value: 20.5, text: '20.5' },
                { value: 21, text: '21' },
                { value: 21.5, text: '21.5' },
                { value: 22, text: '22' },
                { value: 22.5, text: '22.5' },
                { value: 23, text: '23' },
                { value: 23.5, text: '23.5' },
                { value: 24, text: '≥ 24' }
            ];
        }
        
        const defaultValue = (unit === 'pt') ? 16 : 16;

        options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.text;
            fontSizeSelect.appendChild(optionEl);
        });
        
        fontSizeSelect.value = defaultValue;
        showButton();
    }

    function showButton() {
        checkContrastBtn.style.display = 'block';
        checkStatusMessage.style.display = 'none';
    }

    function checkContrast() {
        // Get inputs
        let fontSize = parseFloat(fontSizeSelect.value);
        const fontSizeUnit = fontSizeUnitSelect.value;
        const fontWeight = parseInt(fontWeightSelect.value, 10);
        const fgColorHex = fgColorText.value;
        const bgColorHex = bgColorText.value;
        
        // Convert pt to px if necessary (1pt = 1.333px)
        if (fontSizeUnit === 'pt') {
            fontSize *= 1.333;
        }

        const fgRgb = hexToRgb(fgColorHex);
        const bgRgb = hexToRgb(bgColorHex);

        if (!fgRgb || !bgRgb) return;

        const ratio = getContrastRatio(fgRgb, bgRgb);
        contrastRatioSpan.textContent = ratio.toFixed(2);
        
        // Using a small epsilon for floating point comparison
        const isLargeText = (fontSize >= 24) || (fontSize >= 18.66 - 0.001 && fontWeight >= 700);
        
        const neededRatio = isLargeText ? 3 : 4.5;
        neededRatioSpan.textContent = neededRatio;
        
        aaTextTypeSpan.textContent = `(${isLargeText ? 'Large text' : 'Normal text'})`;

        const aaPass = ratio >= neededRatio;
        updateStatus(aaOverallStatusSpan, aaPass);

        // --- Show or hide suggestions based on pass/fail status ---
        if (aaPass) {
            suggestionsWrapper.style.display = 'none';
        } else {
            const suggestedFg = findPassingColor(fgRgb, bgRgb, neededRatio);
            const suggestedBg = findPassingColor(bgRgb, fgRgb, neededRatio);
            
            const suggestedFgRgb = hexToRgb(suggestedFg);
            const suggestedBgRgb = hexToRgb(suggestedBg);

            suggestionC1Swatch.style.backgroundColor = suggestedFg;
            suggestionC1Hex.textContent = suggestedFg;

            suggestionC2Swatch.style.backgroundColor = suggestedBg;
            suggestionC2Hex.textContent = suggestedBg;
            
            if (suggestedFgRgb) {
                suggestionC1Ratio.textContent = getContrastRatio(suggestedFgRgb, bgRgb).toFixed(2);
            }
            if (suggestedBgRgb) {
                suggestionC2Ratio.textContent = getContrastRatio(fgRgb, suggestedBgRgb).toFixed(2);
            }

            suggestionsWrapper.style.display = 'flex';
        }
        
        // --- Show result message instead of button ---
        checkContrastBtn.style.display = 'none';
        checkStatusMessage.style.display = 'block';
        checkStatusMessage.classList.remove('pass', 'fail');

        if (aaPass) {
            checkStatusMessage.textContent = 'Your contrast is ok';
            checkStatusMessage.classList.add('pass');
        } else {
            checkStatusMessage.textContent = 'Your contrast is not ok';
            checkStatusMessage.classList.add('fail');
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
        let { r, g, b } = rgb;
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
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
        let { h, s, l } = hsl;
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return {
            r: r * 255,
            g: g * 255,
            b: b * 255
        };
    }

    function findPassingColor(fgColor, bgColor, targetRatio) {
        const bgLuminance = getLuminance(bgColor);
        const fgHsl = rgbToHsl(fgColor);

        let direction = (bgLuminance > 0.5) ? -1 : 1;

        let newHsl = { ...fgHsl };
        let currentContrast = getContrastRatio(hslToRgb(newHsl), bgColor);

        if(currentContrast >= targetRatio) return rgbToHex(fgColor);
        
        let min = 0, max = 1;
        if (direction === -1) { max = newHsl.l; } 
        else { min = newHsl.l; }

        for (let i = 0; i < 20; i++) {
            newHsl.l = (min + max) / 2;
            let newRgb = hslToRgb(newHsl);
            if (getContrastRatio(newRgb, bgColor) >= targetRatio) {
                if (direction === 1) max = newHsl.l;
                else min = newHsl.l;
            } else {
                if (direction === 1) min = newHsl.l;
                else max = newHsl.l;
            }
        }
        
        newHsl.l = (direction === 1) ? max : min;
        return rgbToHex(hslToRgb(newHsl));
    }
});

