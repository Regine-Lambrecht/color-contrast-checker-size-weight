document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Coloris ---
    Coloris({
        el: '[data-coloris]',
        themeMode: 'light',
        alpha: true,
        swatches: [],
        format: 'auto', // Format will now match the user's current mode
        formatToggle: true,
        onChange: (color, input) => {
            // This onChange handles changes *from* the Coloris picker itself
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

    // --- Alpha Suggestion Elements ---
    let alphaSuggestionWrapper = document.getElementById('alpha-suggestion-wrapper');
    let alphaSuggestionSwatch = document.getElementById('suggestion-alpha-swatch');
    let alphaSuggestionDetails = document.getElementById('alpha-suggestion-details');
    let alphaSuggestionRatio = document.getElementById('alpha-suggestion-ratio');


    // --- Eyedropper Button Elements ---
    const fgEyedropperBtn = document.getElementById('fg-eyedropper-btn');
    const bgEyedropperBtn = document.getElementById('bg-eyedropper-btn');

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

    // Add input listener to color fields to trigger check on manual input/paste/eyedropper
    fgColorText.addEventListener('input', triggerCheck);
    bgColorText.addEventListener('input', triggerCheck);

    const formatHexOnBlur = (e) => {
        // Don't format if it's not a hex value
        if (e.target.value.startsWith('rgb') || e.target.value.startsWith('hsl')) {
            // Still trigger check in case it's a valid non-hex value pasted
            triggerCheck();
            return;
        }
        const formattedHex = formatHex(e.target.value);
        if (formattedHex !== e.target.value) { // Only update if formatting changed something
             e.target.value = formattedHex;
             // Dispatch input event again IF value changed, so Coloris updates swatch
             e.target.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            // If format didn't change, still trigger check (e.g., if user typed #abcdef)
            triggerCheck();
        }
    };
    fgColorText.addEventListener('blur', formatHexOnBlur);
    bgColorText.addEventListener('blur', formatHexOnBlur);


    // --- Eyedropper Event Listeners ---
    fgEyedropperBtn.addEventListener('click', () => {
        pickColor(fgColorText);
    });

    bgEyedropperBtn.addEventListener('click', () => {
        pickColor(bgColorText);
    });

    // --- Initial Setup ---
    updateFontSizeOptions();
    // Set default values before first check
    fgColorText.value = '#5a6474';
    bgColorText.value = '#ffffff';
    // Manually update Coloris swatches after setting initial values
    Coloris.update(true); 
    triggerCheck(); // Initial contrast check

    // --- Main Functions ---

    // --- Eyedropper Function ---
    async function pickColor(inputElement) {
        if (!window.EyeDropper) {
            console.log('Your browser does not support the EyeDropper API');
            return;
        }

        const eyeDropper = new EyeDropper();
        
        try {
            const result = await eyeDropper.open();
            inputElement.value = result.sRGBHex;
            
            // --- ONLY CHANGE IS HERE ---
            // Dispatch an 'input' event to notify Coloris (and triggerCheck via its listener)
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            // --- END OF CHANGE ---

        } catch (e) {
            console.log('EyeDropper was canceled.'); // User likely pressed Escape
        }
    }

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
    
    // MODIFIED: checkContrast logic for suggestions
    function checkContrast(fgColor, bgColor) {
        const isNonText = noTextCheckbox.checked;
        
        const fgParsed = parseColorToRgb(fgColor); // Parsed Colour 1 (includes 'a')
        const bgParsed = parseColorToRgb(bgColor); // Parsed Colour 2 (includes 'a')

        if (!fgParsed || !bgParsed) {
            suggestionsContainer.style.display = 'none';
            contrastRatioSpan.textContent = '-';
            neededRatioSpan.textContent = '-';
            updateStatus(aaOverallStatusSpan, false);
            aaOverallStatusSpan.textContent = 'FAIL';
            aaTextTypeSpan.textContent = '(Invalid colour)';
            return;
        }
        
        // --- Alpha Handling ---
        let fgRgb, bgRgb; // These will hold the *final* opaque colors used for calculation
        
        if (bgParsed.a < 1) {
            suggestionsContainer.style.display = 'none';
            contrastRatioSpan.textContent = 'N/A';
            neededRatioSpan.textContent = '-';
            updateStatus(aaOverallStatusSpan, false);
            aaOverallStatusSpan.textContent = 'FAIL';
            aaTextTypeSpan.textContent = '(BG must be opaque)';
            return;
        } else {
            bgRgb = bgParsed; // bg is opaque, use as is.
        }

        if (fgParsed.a < 1) {
            fgRgb = flattenColor(fgParsed, bgRgb); // Flatten fg onto bg
        } else {
            fgRgb = fgParsed; // fg is opaque, use as is.
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
            
            // --- Clear old listeners by replacing nodes ---
            alphaSuggestionWrapper.replaceWith(alphaSuggestionWrapper.cloneNode(true)); // NEW
            c1SuggestionWrapper.replaceWith(c1SuggestionWrapper.cloneNode(true));
            c2SuggestionWrapper.replaceWith(c2SuggestionWrapper.cloneNode(true));
            
            // --- Re-select the new nodes ---
            alphaSuggestionWrapper = document.getElementById('alpha-suggestion-wrapper'); // NEW
            alphaSuggestionSwatch = document.getElementById('suggestion-alpha-swatch'); // NEW
            alphaSuggestionDetails = document.getElementById('alpha-suggestion-details'); // NEW
            alphaSuggestionRatio = document.getElementById('alpha-suggestion-ratio'); // NEW
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
            // --- End of re-selection ---

            fontSuggestion.style.display = 'none';
            alphaSuggestionWrapper.style.display = 'none'; // NEW
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

            // --- MODIFIED: Alpha Suggestion Logic ---
            let alphaSuggestionMade = false;
            // Use fgParsed here, which has the original alpha
            if (fgParsed.a < 1) { 
                const requiredAlphaResult = findPassingAlpha(fgParsed, bgRgb, neededRatio); // Now returns object
                if (requiredAlphaResult && requiredAlphaResult.alpha > fgParsed.a) { // Only suggest if alpha needs to increase
                    alphaSuggestionWrapper.style.display = 'flex';
                    const requiredAlpha = requiredAlphaResult.alpha;
                    const finalFlatColor = requiredAlphaResult.finalFlatColor; // Use color from result
                    alphaSuggestionSwatch.style.backgroundColor = rgbToHex(finalFlatColor); // Show the *result*
                    
                    // --- Determine format and create suggested string ---
                    let suggestedColorString = '';
                    let suggestedValueDisplay = '';
                    const currentFgValue = fgColorText.value.trim();
                    const alphaString = requiredAlpha.toFixed(3); // Use 3 decimal places
                    
                    if (currentFgValue.startsWith('rgb')) {
                        suggestedColorString = `rgba(${fgParsed.r}, ${fgParsed.g}, ${fgParsed.b}, ${alphaString})`;
                        suggestedValueDisplay = suggestedColorString;
                    } else if (currentFgValue.startsWith('hsl')) {
                        suggestedColorString = rgbToHslaString(fgParsed, requiredAlpha); // Use new helper
                        suggestedValueDisplay = suggestedColorString;
                    } else { // Assume hex
                        suggestedColorString = rgbToHexWithAlpha(fgParsed, requiredAlpha); // Use new helper
                        suggestedValueDisplay = suggestedColorString;
                    }
                    // --- END: Determine format ---

                    const prefix = firstSuggestionShown ? 'Or change' : 'Change';
                    // MODIFIED: Display the full suggested color value
                    alphaSuggestionDetails.innerHTML = `<span class="suggestion-text">${prefix} Colour 1 to <span class="suggestion-alpha">${suggestedValueDisplay}</span></span>${copyIconSvg}`;

                    // Add accessibility & click listeners for alpha suggestion
                    alphaSuggestionDetails.setAttribute('role', 'button');
                    alphaSuggestionDetails.setAttribute('tabindex', '0');
                    const copyAlphaFunc = () => copyToClipboard(suggestedColorString, alphaSuggestionDetails); // Copy the formatted string
                    alphaSuggestionDetails.addEventListener('click', copyAlphaFunc);
                    alphaSuggestionDetails.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            copyAlphaFunc();
                        }
                    });

                    // Use the ratio from the result
                    alphaSuggestionRatio.textContent = `(Final ratio: ${requiredAlphaResult.finalRatio.toFixed(2)})`;
                    
                    firstSuggestionShown = true;
                    alphaSuggestionMade = true;
                }
            }
            // --- END: Alpha Suggestion Logic ---


            // --- MODIFIED: Color Suggestion 1 (Foreground) ---
            // Only suggest changing hex if alpha wasn't suggested
            if (!alphaSuggestionMade) { 
                const suggestedFgResult = findPassingColor(fgRgb, bgRgb, neededRatio); // Uses potentially flattened fgRgb
                // Compare with original fgParsed hex equivalent, or fgRgb if it was already opaque
                const originalOpaqueHex = rgbToHex(fgParsed.a === 1 ? fgParsed : fgRgb); 
                
                if (suggestedFgResult && suggestedFgResult.hex.toLowerCase() !== originalOpaqueHex.toLowerCase()) {
                    c1SuggestionWrapper.style.display = 'flex';
                    c1SuggestionSwatch.style.backgroundColor = suggestedFgResult.hex;

                    const prefix = firstSuggestionShown ? 'Or replace' : 'Replace';
                    c1SuggestionDetails.innerHTML = `<span class="suggestion-text">${prefix} Colour 1 with <span class="suggestion-hex">${suggestedFgResult.hex}</span></span>${copyIconSvg}`;

                    // Add Accessibility & Click Listeners
                    c1SuggestionDetails.setAttribute('role', 'button');
                    c1SuggestionDetails.setAttribute('tabindex', '0');
                    const copyFunc1 = () => copyToClipboard(suggestedFgResult.hex, c1SuggestionDetails);
                    c1SuggestionDetails.addEventListener('click', copyFunc1);
                    c1SuggestionDetails.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault(); 
                            copyFunc1();
                        }
                    });

                    // Parse the suggestion *without* alpha for ratio calculation
                    const suggestedFgOpaqueParsed = parseColorToRgb(suggestedFgResult.hex);
                    const finalRatio = getContrastRatio(suggestedFgOpaqueParsed, bgRgb);
                    c1SuggestionHslRatio.textContent = `HSL true ratio: ${suggestedFgResult.perfectRatio.toFixed(2)}`;
                    c1SuggestionRgbRatio.textContent = `(RGB converted ratio: ${finalRatio.toFixed(2)})`;

                    firstSuggestionShown = true;
                }
            }

            // --- Color Suggestion 2 (Background - UNCHANGED logic, just added A11y) ---
            const suggestedBgResult = findPassingColor(bgRgb, fgRgb, neededRatio); // Use bgRgb (always opaque) and fgRgb (flattened if needed)
            if (suggestedBgResult && suggestedBgResult.hex.toLowerCase() !== rgbToHex(bgRgb).toLowerCase()) {
                c2SuggestionWrapper.style.display = 'flex';
                c2SuggestionSwatch.style.backgroundColor = suggestedBgResult.hex;

                const prefix = firstSuggestionShown ? 'Or replace' : 'Replace';
                c2SuggestionDetails.innerHTML = `<span class="suggestion-text">${prefix} Colour 2 with <span class="suggestion-hex">${suggestedBgResult.hex}</span></span>${copyIconSvg}`;
                
                // Add Accessibility & Click Listeners
                c2SuggestionDetails.setAttribute('role', 'button');
                c2SuggestionDetails.setAttribute('tabindex', '0');
                const copyFunc2 = () => copyToClipboard(suggestedBgResult.hex, c2SuggestionDetails);
                c2SuggestionDetails.addEventListener('click', copyFunc2);
                c2SuggestionDetails.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault(); 
                        copyFunc2();
                    }
                });

                // Parse suggestion *without* alpha
                const suggestedBgOpaqueParsed = parseColorToRgb(suggestedBgResult.hex);
                const finalRatio = getContrastRatio(fgRgb, suggestedBgOpaqueParsed);
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
        if (!textSpan) { // Safety check
            element.classList.remove('copy-busy');
            return; 
        }

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

    // --- NEW: Helper to convert RGB object + alpha to #RRGGBBAA hex string ---
    function rgbToHexWithAlpha(rgb, alpha) {
        const rHex = rgb.r.toString(16).padStart(2, '0');
        const gHex = rgb.g.toString(16).padStart(2, '0');
        const bHex = rgb.b.toString(16).padStart(2, '0');
        const aHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
        return `#${rHex}${gHex}${bHex}${aHex}`;
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

     // --- NEW: Helper to convert RGB object + alpha to hsla() string ---
     function rgbToHslaString(rgb, alpha) {
         const hsl = rgbToHsl(rgb);
         const h = Math.round(hsl.h * 360);
         const s = Math.round(hsl.s * 100);
         const l = Math.round(hsl.l * 100);
         // Use toFixed(3) for alpha for better precision in the string
         return `hsla(${h}, ${s}%, ${l}%, ${alpha.toFixed(3)})`; 
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
    
    // --- Suggestion Algorithm (Lightness) ---
    function findPassingColor(colorToChange, otherColor, targetRatio) {
        // This is the opaque color object {r, g, b}
        const otherLuminance = getLuminance(otherColor);
        // This is the {r, g, b} of the color we might change (could be flattened)
        const currentRgb = colorToChange; 
        const colorHsl = rgbToHsl(currentRgb);
        
        let direction = (otherLuminance > 0.5) ? -1 : 1; // -1 = darker, 1 = lighter
    
        let min = 0, max = 1;
        if (direction === -1) { max = colorHsl.l; } 
        else { min = colorHsl.l; }
    
        let bestPassingLightness = null;
    
        // Binary search for lightness
        for (let i = 0; i < 30; i++) {
            let mid = (min + max) / 2;
            let currentTestRgb = hslToRgb({ ...colorHsl, l: mid });
            if (getContrastRatio(currentTestRgb, otherColor) >= targetRatio) {
                bestPassingLightness = mid;
                if (direction === 1) { max = mid; } else { min = mid; }
            } else {
                if (direction === 1) { min = mid; } else { max = mid; }
            }
        }
    
        // Try opposite direction if needed
        if (bestPassingLightness === null) {
            direction *= -1;
            min = 0; max = 1;
            if (direction === -1) { max = colorHsl.l; } else { min = colorHsl.l; }
            for (let i = 0; i < 30; i++) {
                 let mid = (min + max) / 2;
                 let currentTestRgb = hslToRgb({ ...colorHsl, l: mid });
                 if (getContrastRatio(currentTestRgb, otherColor) >= targetRatio) {
                     bestPassingLightness = mid;
                     if (direction === 1) { max = mid; } else { min = mid; }
                 } else {
                     if (direction === 1) { min = mid; } else { max = mid; }
                 }
            }
        }
    
        if (bestPassingLightness === null) return null;
    
        // Nudge slightly past the target ratio
        let finalHsl = { ...colorHsl, l: bestPassingLightness };
        let finalRatio = getContrastRatio(hslToRgb(finalHsl), otherColor);
        let iterations = 0;
        while (finalRatio < targetRatio && iterations < 100) {
            finalHsl.l += (direction * 0.0001);
            finalHsl.l = Math.max(0, Math.min(1, finalHsl.l)); // Clamp between 0 and 1
            finalRatio = getContrastRatio(hslToRgb(finalHsl), otherColor);
            iterations++;
             if(finalHsl.l === 0 || finalHsl.l === 1) break; // Stop if we hit black/white
        }
        
        if (finalRatio < targetRatio) return null; // Still couldn't pass
        
        const finalHex = rgbToHex(hslToRgb(finalHsl));
        return { hex: finalHex, perfectRatio: finalRatio };
    }

    // --- MODIFIED Suggestion Algorithm (Alpha) ---
    function findPassingAlpha(fgColorParsed, bgColorOpaque, targetRatio) {
        let minAlpha = fgColorParsed.a; // Start from current alpha
        let maxAlpha = 1.0;
        let bestPassingAlpha = null;
        let finalRatio = 0;
        let finalFlatColor = null;

        // Binary search: Find an alpha that passes
        for (let i = 0; i < 30; i++) {
            let midAlpha = (minAlpha + maxAlpha) / 2;
            let currentFg = { ...fgColorParsed, a: midAlpha };
            let flattenedColor = flattenColor(currentFg, bgColorOpaque);
            
            if (getContrastRatio(flattenedColor, bgColorOpaque) >= targetRatio) {
                bestPassingAlpha = midAlpha;
                finalRatio = getContrastRatio(flattenedColor, bgColorOpaque); // Store ratio
                finalFlatColor = flattenedColor; // Store color
                maxAlpha = midAlpha; // Found a passing alpha, try lower values (closer to original)
            } else {
                minAlpha = midAlpha; // Need higher alpha
            }
        }

        // If binary search didn't find *any* passing value (even alpha=1), return null
        if (bestPassingAlpha === null) {
             // Check one last time at alpha=1 just in case
             let checkFullOpacity = flattenColor({ ...fgColorParsed, a: 1.0 }, bgColorOpaque);
             if (getContrastRatio(checkFullOpacity, bgColorOpaque) >= targetRatio) {
                 return { alpha: 1.0, finalRatio: getContrastRatio(checkFullOpacity, bgColorOpaque), finalFlatColor: checkFullOpacity };
             }
             return null;
        }

        // Refine: Now search *downwards* from bestPassingAlpha to find the minimum passing alpha
        minAlpha = fgColorParsed.a; // Reset lower bound
        maxAlpha = bestPassingAlpha; // Upper bound is the passing alpha we found
        
        for (let i = 0; i < 30; i++) { // More iterations for refinement
            let midAlpha = (minAlpha + maxAlpha) / 2;
            let currentFg = { ...fgColorParsed, a: midAlpha };
            let flattenedColor = flattenColor(currentFg, bgColorOpaque);
            let currentRatio = getContrastRatio(flattenedColor, bgColorOpaque);

            if (currentRatio >= targetRatio) {
                 // It passes, try even lower alpha
                 bestPassingAlpha = midAlpha; 
                 finalRatio = currentRatio;
                 finalFlatColor = flattenedColor;
                 maxAlpha = midAlpha;
            } else {
                 // It fails, need higher alpha
                 minAlpha = midAlpha;
            }
        }

        // Ensure the final selected alpha actually passes (due to floating point)
        // If not, nudge slightly upwards
        let finalAlpha = bestPassingAlpha;
        let iterations = 0;
        while(getContrastRatio(flattenColor({ ...fgColorParsed, a: finalAlpha }, bgColorOpaque), bgColorOpaque) < targetRatio && iterations < 100) {
            finalAlpha += 0.0001; // Small nudge up
            finalAlpha = Math.min(1, finalAlpha); // Clamp at 1
            iterations++;
            if (finalAlpha === 1) break;
        }

        // Recalculate final values based on the potentially nudged alpha
        finalFlatColor = flattenColor({ ...fgColorParsed, a: finalAlpha }, bgColorOpaque);
        finalRatio = getContrastRatio(finalFlatColor, bgColorOpaque);

        // Return the refined alpha, ratio, and resulting color
        return { alpha: finalAlpha, finalRatio: finalRatio, finalFlatColor: finalFlatColor };
    }
});
