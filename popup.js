document.addEventListener('DOMContentLoaded', () => {
    /* --- INITIALIZATION --- */
    Coloris({
        el: '[data-coloris]',
        themeMode: 'light',
        alpha: true,
        swatches: [],
        format: 'auto',
        formatToggle: true,
        onChange: (color, input) => {
            input.value = color;
            handleInput(input.id.startsWith('fg') ? 'fg' : 'bg');
        }
    });

    const fontSizeSelect = document.getElementById('font-size');
    const fontWeightSelect = document.getElementById('font-weight');
    const fgColorText = document.getElementById('fg-color-text');
    const bgColorText = document.getElementById('bg-color-text');
    const noTextCheckbox = document.getElementById('no-text-legend-checkbox');
    const contrastRatioSpan = document.getElementById('contrast-ratio');
    const neededRatioSpan = document.getElementById('needed-ratio');
    const aaOverallStatusSpan = document.getElementById('aa-overall-status');
    const aaTextTypeSpan = document.getElementById('aa-text-type');
    const successMessage = document.getElementById('success-message');
    const suggestionsContainer = document.querySelector('.suggestions-container');

    const fgCopyBtn = document.getElementById('fg-copy-btn');
    const bgCopyBtn = document.getElementById('bg-copy-btn');

    /* --- PERSISTENCE --- */
    function loadSavedData() {
        chrome.storage.local.get(['fg', 'bg', 'fontSize', 'fontWeight', 'isNonText', 'unit'], (data) => {
            if (data.fg) fgColorText.value = data.fg;
            if (data.bg) bgColorText.value = data.bg;
            if (data.unit) {
                document.getElementById(`unit-${data.unit}`).checked = true;
                updateFontSizeOptions();
            }
            if (data.fontSize) fontSizeSelect.value = data.fontSize;
            if (data.fontWeight) fontWeightSelect.value = data.fontWeight;
            if (data.isNonText !== undefined) noTextCheckbox.checked = data.isNonText;

            triggerCheck();
        });
    }

    function saveData() {
        const unit = document.querySelector('input[name="font-size-unit"]:checked').value;
        chrome.storage.local.set({
            fg: fgColorText.value,
            bg: bgColorText.value,
            fontSize: fontSizeSelect.value,
            fontWeight: fontWeightSelect.value,
            isNonText: noTextCheckbox.checked,
            unit: unit
        });
    }

    /* --- EVENT LISTENERS --- */
    const triggerCheck = () => {
        saveData();
        checkContrast(fgColorText.value, bgColorText.value);
    };

    const handleInput = (prefix) => {
        updateCopyTooltips();
        triggerCheck();
    };

    fgColorText.addEventListener('mousedown', () => document.body.classList.remove('bg-picker-active'));
    bgColorText.addEventListener('mousedown', () => document.body.classList.add('bg-picker-active'));
    fgColorText.addEventListener('input', () => handleInput('fg'));
    bgColorText.addEventListener('input', () => handleInput('bg'));
    fontSizeSelect.addEventListener('change', triggerCheck);
    fontWeightSelect.addEventListener('change', triggerCheck);
    
    document.querySelectorAll('input[name="font-size-unit"]').forEach(radio => {
        radio.addEventListener('change', () => {
            updateFontSizeOptions();
            triggerCheck();
        });
    });

    noTextCheckbox.addEventListener('change', (e) => {
        const isNoText = e.target.checked;
        document.querySelectorAll('input[name="font-size-unit"]').forEach(r => r.disabled = isNoText);
        fontSizeSelect.disabled = isNoText;
        fontWeightSelect.disabled = isNoText;
        triggerCheck();
    });

    document.getElementById('fg-eyedropper-btn').addEventListener('click', () => pickColor(fgColorText));
    document.getElementById('bg-eyedropper-btn').addEventListener('click', () => pickColor(bgColorText));

    const copyToClipboard = (btn, text) => {
        navigator.clipboard.writeText(text).then(() => {
            const icon = btn.querySelector('i');
            const originalClass = icon.className;
            icon.className = 'fa-solid fa-check';
            btn.classList.add('success');
            setTimeout(() => {
                icon.className = originalClass;
                btn.classList.remove('success');
            }, 1500);
        });
    };

    fgCopyBtn.addEventListener('click', () => copyToClipboard(fgCopyBtn, fgColorText.value));
    bgCopyBtn.addEventListener('click', () => copyToClipboard(bgCopyBtn, bgColorText.value));

    /* --- LOGIC --- */
    function updateCopyTooltips() {
        fgCopyBtn.title = `Copy ${fgColorText.value}`;
        bgCopyBtn.title = `Copy ${bgColorText.value}`;
    }

    function updateFontSizeOptions() {
        const unit = document.querySelector('input[name="font-size-unit"]:checked').value;
        const currentVal = fontSizeSelect.value;
        fontSizeSelect.innerHTML = '';
        let options = unit === 'pt' ? 
            [{ value: 12, text: 'Less than 14' }, { value: 14, text: '14 to 17.99' }, { value: 18, text: '18 or more' }] :
            [{ value: 16, text: 'Less than 18.66' }, { value: 18.66, text: '18.66 to 23.99' }, { value: 24, text: '24 or more' }];

        options.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.value; o.textContent = opt.text;
            fontSizeSelect.appendChild(o);
        });
        fontSizeSelect.value = options.find(o => o.value == currentVal) ? currentVal : options[0].value;
    }

    function checkContrast(fgColor, bgColor) {
        const isNonText = noTextCheckbox.checked;
        const fgParsed = parseColorToRgb(fgColor);
        const bgParsed = parseColorToRgb(bgColor);

        if (!fgParsed || !bgParsed) {
            suggestionsContainer.style.display = 'none';
            successMessage.style.display = 'none';
            contrastRatioSpan.textContent = '-';
            contrastRatioSpan.style.color = '';
            return;
        }

        const fgRgb = fgParsed.a < 1 ? flattenColor(fgParsed, bgParsed) : fgParsed;
        const ratio = getContrastRatio(fgRgb, bgParsed);
        contrastRatioSpan.textContent = ratio.toFixed(2);

        let needed = 4.5;
        let isLarge = false;
        if (!isNonText) {
            const fs = parseFloat(fontSizeSelect.value);
            const unit = document.querySelector('input[name="font-size-unit"]:checked').value;
            const weight = parseInt(fontWeightSelect.value, 10);
            if (unit === 'pt') { isLarge = (fs >= 18) || (fs >= 14 && weight >= 700); }
            else { isLarge = (fs >= 24) || (fs >= 18.66 && weight >= 700); }
            needed = isLarge ? 3.0 : 4.5;
        } else {
            needed = 3.0;
        }

        const passes = ratio >= needed;
        contrastRatioSpan.style.color = passes ? 'var(--pass-color)' : 'var(--fail-color)';
        neededRatioSpan.textContent = needed.toFixed(2);
        
        if (isNonText) {
            aaOverallStatusSpan.innerHTML = passes ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-xmark"></i>';
        } else {
            aaOverallStatusSpan.textContent = passes ? 'PASS' : 'FAIL';
        }
        aaOverallStatusSpan.style.color = fgColor;
        aaOverallStatusSpan.style.backgroundColor = bgColor;
        aaTextTypeSpan.textContent = isNonText ? '(Graphics/UI)' : `(${isLarge ? 'Large text' : 'Normal text'})`;

        if (passes) {
            suggestionsContainer.style.display = 'none';
            successMessage.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'flex';
            successMessage.style.display = 'none';
            generateSuggestions(fgColor, bgColor, fgParsed, bgParsed, needed, isNonText, isLarge, ratio);
        }
    }

    function setupSuggestionBtn(btn, text, labelEl) {
        btn.innerHTML = '<i class="fa-solid fa-copy"></i>';
        btn.title = `Copy ${text}`;
        btn.onclick = (e) => { e.stopPropagation(); copyToClipboard(btn, text); };
    }

    function generateSuggestions(fgColor, bgColor, fgParsed, bgParsed, needed, isNonText, isLarge, currentRatio) {
        const types = ['font', 'alpha', 'c1', 'c2'];
        types.forEach(t => document.getElementById(`${t === 'font' ? 'font-suggestion' : t + '-suggestion-wrapper'}`).style.display = 'none');

        const fgFormat = getColorFormat(fgColor), bgFormat = getColorFormat(bgColor);
        const currentFgFormatted = formatColor(fgParsed, fgFormat), currentBgFormatted = formatColor(bgParsed, bgFormat);

        const styleBadge = (badge, f, b, isPass) => {
            if (isNonText) badge.innerHTML = isPass ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-xmark"></i>';
            else badge.textContent = isPass ? 'PASS' : 'FAIL';
            badge.style.color = f; badge.style.backgroundColor = b;
        };

        if (!isNonText && !isLarge && currentRatio >= 3.0) {
            const s = document.getElementById('font-suggestion');
            s.style.display = 'flex';
            const b = document.getElementById('font-suggestion-badge');
            b.textContent = 'PASS'; b.style.color = fgColor; b.style.backgroundColor = bgColor;
            b.style.fontSize = "18.66px"; b.style.fontWeight = "700";
            document.getElementById('font-suggestion-label').textContent = `Enlarge text: min 18.66px (14pt) bold or 24px (18pt) regular.`;
            document.getElementById('font-suggestion-ratio-val').textContent = `Ratio: ${currentRatio.toFixed(2)} with Front ${currentFgFormatted} and Background ${currentBgFormatted}`;
        }

        if (fgParsed.a < 1) {
            const pA = findPassingAlpha(fgParsed, bgParsed, needed);
            if (pA) {
                const wrapper = document.getElementById('alpha-suggestion-wrapper');
                wrapper.style.display = 'flex';
                const str = formatColor(fgParsed, fgFormat, pA);
                styleBadge(document.getElementById('suggestion-alpha-swatch'), str, bgColor, true);
                const label = document.getElementById('alpha-suggestion-label');
                label.innerHTML = `Set Front Alpha to <span class="suggestion-hex">${str}</span>`;
                document.getElementById('alpha-suggestion-ratio-val').textContent = `Ratio: ${needed.toFixed(2)} with ${currentBgFormatted}`;
                setupSuggestionBtn(document.getElementById('alpha-suggestion-copy-btn'), str, label);
            }
        }

        const sFg = findPassingColor(fgParsed.a < 1 ? flattenColor(fgParsed, bgParsed) : fgParsed, bgParsed, needed);
        if (sFg) {
            const wrapper = document.getElementById('c1-suggestion-wrapper');
            wrapper.style.display = 'flex';
            const str = formatColor(sFg.rgb, fgFormat);
            styleBadge(document.getElementById('suggestion-c1-swatch'), str, bgColor, true);
            const label = document.getElementById('c1-suggestion-label');
            label.innerHTML = `Replace Front with <span class="suggestion-hex">${str}</span>`;
            document.getElementById('c1-suggestion-ratio-val').textContent = `Ratio: ${sFg.ratio.toFixed(2)} with ${currentBgFormatted}`;
            setupSuggestionBtn(document.getElementById('c1-suggestion-copy-btn'), str, label);
        }

        const sBg = findPassingColor(bgParsed, fgParsed.a < 1 ? flattenColor(fgParsed, bgParsed) : fgParsed, needed);
        if (sBg) {
            const wrapper = document.getElementById('c2-suggestion-wrapper');
            wrapper.style.display = 'flex';
            const str = formatColor(sBg.rgb, bgFormat);
            styleBadge(document.getElementById('suggestion-c2-swatch'), fgColor, str, true);
            const label = document.getElementById('c2-suggestion-label');
            label.innerHTML = `Replace Background with <span class="suggestion-hex">${str}</span>`;
            document.getElementById('c2-suggestion-ratio-val').textContent = `Ratio: ${sBg.ratio.toFixed(2)} with ${currentFgFormatted}`;
            setupSuggestionBtn(document.getElementById('c2-suggestion-copy-btn'), str, label);
        }
    }

    /* --- MATH HELPERS --- */
    function getLuminance(rgb) {
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
            c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function getContrastRatio(rgb1, rgb2) {
        const l1 = getLuminance(rgb1), l2 = getLuminance(rgb2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }
    function flattenColor(fg, bg) {
        return { r: Math.round(fg.a * fg.r + (1 - fg.a) * bg.r), g: Math.round(fg.a * fg.g + (1 - fg.a) * bg.g), b: Math.round(fg.a * fg.b + (1 - fg.a) * bg.b) };
    }
    function parseColorToRgb(str) {
        const div = document.createElement('div'); div.style.color = str; document.body.appendChild(div);
        const computed = getComputedStyle(div).color; document.body.removeChild(div);
        const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        return match ? { r: +match[1], g: +match[2], b: +match[3], a: match[4] !== undefined ? +match[4] : 1 } : null;
    }
    function getColorFormat(str) { if (str.startsWith('rgb')) return 'rgb'; if (str.startsWith('hsl')) return 'hsl'; return 'hex'; }
    function formatColor(rgbObj, format, alphaOverride = null) {
        const a = alphaOverride !== null ? alphaOverride : (rgbObj.a !== undefined ? rgbObj.a : 1.0);
        if (format === 'rgb') return a < 1 ? `rgba(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}, ${a.toFixed(2)})` : `rgb(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b})`;
        if (format === 'hsl') {
            const { h, s, l } = rgbToHsl(rgbObj);
            const H = Math.round(h * 360), S = Math.round(s * 100), L = Math.round(l * 100);
            return a < 1 ? `hsla(${H}, ${S}%, ${L}%, ${a.toFixed(2)})` : `hsl(${H}, ${S}%, ${L}%)`;
        }
        const toH = (v) => Math.round(v).toString(16).padStart(2, '0');
        const hex = "#" + toH(rgbObj.r) + toH(rgbObj.g) + toH(rgbObj.b);
        return (format === 'hex' && a < 1) ? hex + toH(a * 255) : hex;
    }
    function rgbToHsl(rgb) {
        let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255, max = Math.max(r, g, b), min = Math.min(r, g, b), h, s, l = (max + min) / 2;
        if (max === min) h = s = 0;
        else {
            const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
            h /= 6;
        }
        return { h, s, l };
    }
    function hslToRgb(hsl) {
        let h = hsl.h, s = hsl.s, l = hsl.l, r, g, b;
        if (s === 0) r = g = b = l;
        else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
            const h2r = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; };
            r = h2r(p, q, h + 1/3); g = h2r(p, q, h); b = h2r(p, q, h - 1/3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }
    function findPassingColor(color, target, ratio) {
        const hsl = rgbToHsl(color), lTarget = getLuminance(target), direction = lTarget > 0.5 ? -1 : 1;
        for (let step = 0; step <= 100; step++) {
            const newL = Math.max(0, Math.min(1, hsl.l + (step * 0.01 * direction)));
            const rgb = hslToRgb({ ...hsl, l: newL });
            if (getContrastRatio(rgb, target) >= ratio) return { rgb, ratio: getContrastRatio(rgb, target) };
        }
        return null;
    }
    function findPassingAlpha(fg, bg, needed) {
        for (let a = 0.01; a <= 1; a += 0.01) { if (getContrastRatio(flattenColor({ ...fg, a }, bg), bg) >= needed) return a; }
        return null;
    }
    async function pickColor(inputElement) {
        if (!window.EyeDropper) return;
        const eyeDropper = new EyeDropper();
        try { const result = await eyeDropper.open(); inputElement.value = result.sRGBHex; inputElement.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
    }

    loadSavedData();
    updateCopyTooltips();
});
