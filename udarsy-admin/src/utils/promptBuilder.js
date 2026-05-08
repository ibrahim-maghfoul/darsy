export const buildImagePrompt = ({ designPhrase, theme, headline, subline, mood, geometricDensity, figurePlacement, shapeStyle, bgTexture, lang = 'English' }) => {
    const isArabic = lang === 'Arabic';

    const bgColor = theme === 'green'
        ? (isArabic ? 'أخضر (#3aaa6a)' : 'green (#3aaa6a)')
        : (isArabic ? 'أبيض (#ffffff)' : 'white (#ffffff)');

    const shapeColor = theme === 'green'
        ? (isArabic ? 'أبيض (#ffffff)' : 'white (#ffffff)')
        : (isArabic ? 'أخضر (#3aaa6a)' : 'green (#3aaa6a)');

    const textColor = theme === 'green'
        ? (isArabic ? 'أبيض (#ffffff)' : 'white (#ffffff)')
        : (isArabic ? 'أسود (#111111)' : 'black (#111111)');

    const moodMapEn = {
        'calm and confident': 'soft diffused studio light, composed and steady atmosphere, low contrast shadows',
        'energetic and dynamic': 'dramatic high-contrast lighting, sharp directional beams, kinetic sense of motion',
        'contemplative and still': 'cool ambient light, minimal shadows, quiet negative space, meditative stillness',
        'bold and assertive': 'hard rim lighting, deep blacks, powerful contrast, strong visual weight',
        'hopeful and aspirational': 'warm uplighting from below, gentle gradient glow, expansive and open atmosphere',
    };

    const moodMapAr = {
        'calm and confident': 'إضاءة استوديو ناعمة وموزعة، جو هادئ وواثق، ظلال منخفضة التباين',
        'energetic and dynamic': 'إضاءة درامية عالية التباين، أشعة اتجاهية حادة، إحساس حركي وديناميكي',
        'contemplative and still': 'إضاءة محيطية باردة، ظلال بسيطة، مساحة سلبية هادئة، سكون تأملي',
        'bold and assertive': 'إضاءة حواف حادة، أسود عميق، تباين قوي، وزن بصري قوي',
        'hopeful and aspirational': 'إضاءة دافئة من الأسفل، توهج تدريجي ناعم، جو واسع ومفتوح',
    };

    const moodLine = isArabic ? (moodMapAr[mood] || moodMapAr['calm and confident']) : (moodMapEn[mood] || moodMapEn['calm and confident']);

    const densityMapEn = {
        'sparse': '1–2 large, breathing geometric elements with generous empty space between them',
        'balanced': '3–4 geometric elements at varied scales, evenly weighted across the canvas',
        'layered': '5–7 overlapping geometric elements at multiple depths creating rich visual layers',
    };

    const densityMapAr = {
        'sparse': 'عنصر أو عنصرين هندسيين كبيرين مع مساحة فارغة واسعة بينهما',
        'balanced': '3 إلى 4 عناصر هندسية بأحجام متفاوتة، موزعة بشكل متوازن على اللوحة',
        'layered': '5 إلى 7 عناصر هندسية متداخلة بأعماق متعددة لإنشاء طبقات بصرية غنية',
    };

    const densityLine = isArabic ? (densityMapAr[geometricDensity] || densityMapAr['balanced']) : (densityMapEn[geometricDensity] || densityMapEn['balanced']);

    const placementMapEn = {
        'lower-left third': 'Human figure anchored in the lower-left third, head cropped at top of zone, body bleeding off the left edge',
        'right-of-center': 'Human figure placed right-of-center, spine on the 2/3 vertical, negative space dominant on the left',
        'lower-right bleeding edge': 'Human figure in the lower-right corner, body cropping off the right and bottom edges simultaneously',
        'centered but asymmetrically cropped': 'Human figure centered horizontally but cropped asymmetrically — head cut at top, one arm bleeding off a side edge',
    };

    const placementMapAr = {
        'lower-left third': 'شخصية بشرية ترتكز في الثلث اليساري السفلي، الرأس مقصوص عند أعلى المنطقة، والجسم يمتد خارج الحافة اليسرى',
        'right-of-center': 'شخصية بشرية موضوعة يمين الوسط، العمود الفقري على ثلثي الخط العمودي، مساحة سلبية سائدة في اليسار',
        'lower-right bleeding edge': 'شخصية بشرية في الزاوية اليمنى السفلى، الجسم يمتد خارج الحافة اليمنى والسفلى معًا',
        'centered but asymmetrically cropped': 'شخصية بشرية في المنتصف أفقيًا ولكن مقصوصة بشكل غير متماثل — الرأس مقصوص من الأعلى، وذراع واحدة تمتد خارج الحافة الجانبية',
    };

    const placementLine = isArabic ? (placementMapAr[figurePlacement] || placementMapAr['right-of-center']) : (placementMapEn[figurePlacement] || placementMapEn['right-of-center']);

    const shapeStyleLine = isArabic
        ? (shapeStyle ? `لغة الأشكال الهندسية: ${shapeStyle}. جميع الأشكال مصممة بلون ${shapeColor}.` : `الأشكال الهندسية: دوائر وأقواس. جميع الأشكال مصممة بلون ${shapeColor}.`)
        : (shapeStyle ? `Geometric shape language: ${shapeStyle}. All shapes rendered in ${shapeColor}.` : `Geometric shapes: circles and arcs. All shapes rendered in ${shapeColor}.`);

    const bgTextureLine = isArabic
        ? (bgTexture ? `سطح الخلفية: أساس بلون ${bgColor} مع نسيج ${bgTexture} خفيف — يضيف عمقًا ملموسًا دون التنافس مع الشخصية.` : `الخلفية: لون ${bgColor} مسطح وصلب، نظيف وناعم.`)
        : (bgTexture ? `Background surface: ${bgColor} base with subtle ${bgTexture} texture — adds tactile depth without competing with the figure.` : `Background: solid flat ${bgColor}, clean and smooth.`);

    if (isArabic) {
        return `ملصق تصميم جرافيك تحريري فني.

المزاج والجو العام:
${moodLine}

الخلفية:
${bgTextureLine}

اللون:
- اللون الرئيسي: ${bgColor}
- اللون الثانوي / لون التمييز: ${shapeColor}
- الأشكال الهندسية وعناصر التمييز فقط بلون: ${shapeColor}
- يمنع استخدام الألوان التالية قطعياً: البرتقالي، الأصفر، الأحمر، الأزرق، البني، أو أي لون دافئ

المشهد:
${designPhrase}
${placementLine}، مرسومة بظلال مسطحة أو ناعمة باستخدام لون ${shapeColor}.

التكوين الهندسي:
${shapeStyleLine}
${densityLine}
- عنصر واحد تقريباً مائل بزاوية 10-25 درجة عن الوضع العمودي
- 1-2 خطوط رفيعة جداً بلون ${shapeColor}
- يجب أن تكون جميع الأشكال المائلة والشخصية مقصوصة عند حواف اللوحة أو تمتد خارجها

النصوص المعروضة — يجب استخدام هذه العبارات بدقة، ولا تضف أية نصوص أخرى:
1. "${headline}" — بخط عرض كبير وبارز، غير متمركز، بلون ${textColor}
${subline ? `2. "${subline}" — بخط خفيف وصغير، بالقرب من العنوان الرئيسي، بلون ${textColor}` : ''}

- يمنع تضمين أي اسم علامة تجارية أو شعارات أو علامة مائية.`.trim();
    }

    // Default English
    return `Artistic editorial graphic design poster.

MOOD & ATMOSPHERE:
${moodLine}

BACKGROUND:
${bgTextureLine}

COLOR:
- Main color ${bgColor}
- Secondary / accent color ${shapeColor}
- Geometric shapes and accent elements: ${shapeColor} only
- FORBIDDEN: orange, yellow, red, blue, brown, any warm tone

SCENE:
${designPhrase}
${placementLine}, rendered in flat or softly shaded tones using ${shapeColor}.

GEOMETRIC COMPOSITION:
${shapeStyleLine}
${densityLine}
- One element tilted 10–25° from vertical
- 1–2 thin hairline rule lines in ${shapeColor}
- All shapes and figure crop at or bleed beyond canvas edges

TEXT — exactly these phrases, no other text:
1. "${headline}" — large bold display type, off-center, color ${textColor}
${subline ? `2. "${subline}" — small light weight, near the headline, color ${textColor}` : ''}

- Do NOT include any brand name, logo, or watermark`.trim();
};
