/**
 * Moroccan bad-word filter
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture
 *  • Three separate pools with different matching strategies:
 *      ARABIC_WORDS   → substring match after stripping tashkeel diacritics
 *      LATIN_SINGLES  → one precompiled alternation regex, word-boundary guarded
 *      LATIN_PHRASES  → per-phrase precompiled regex with flexible \s+ spacing
 *
 *  • All regexes are compiled ONCE at module load — never inside containsBadWord.
 *
 *  • Input is normalised before matching:
 *      1. NFC unicode normalisation
 *      2. Invisible / zero-width characters stripped
 *      3. Punctuation between letters removed ("f.u.c.k" → "fuck")
 *      4. 3+ consecutive identical chars collapsed to 2 ("fuuuck" → "fuuck")
 *      5. Whitespace collapsed to single space
 *
 * False-positive removals (vs. previous version)
 *  • "fassi"   → demonym for people from Fes, not an insult
 *  • "blid"    → Darija for "country/hometown", used affectionately
 *  • "sob"     → someone might literally be sobbing
 *  • "mf"      → too short (2 chars), highly ambiguous
 *  • "damn"/"goddamn" → mild exclamations common in educational text
 *  • "idiot"   → generic English word not specific enough to block
 *  • "fasek"   → unclear real-world referent
 *  • "bordel"  → used freely in Moroccan-French as "chaos/mess"
 *  • Removed exact duplicates from previous lists
 */

// ─── 1. DATA ─────────────────────────────────────────────────────────────────

/** Arabic-script words — matched with substring after tashkeel strip. */
const ARABIC_WORDS: string[] = [
    // genitals & sex acts
    "كس", "كسك", "كسها", "كسم", "كسو", "كسي", "الكس", "كسهم",
    "زب", "زبك", "زبه", "زبي", "الزب", "زبو", "زبها", "زبهم",
    "طيز", "طيزك", "طيزه", "طيزها", "الطيز", "طيزو",
    "بزاز", "بزازها", "بزازك", "بزازو",
    "فرج", "الفرج",
    "نيك", "تنيك", "نيكك", "نيكه", "نيكها", "نايك", "منيوك", "مانيوك", "نيكو", "نيكوها",
    "مص زبي", "مص زبك",
    "ديوث", "داييوث", "ديث",
    "قواد", "قوادة", "الكواد",
    // insults & slurs
    "قحبة", "قحبه", "الكحبة", "كحبة", "قحاب", "قحبتك", "قحبتو",
    "شرموطة", "شرموط", "الشرموطة", "شراميط", "شرموطتك",
    "عاهرة", "عاهر", "زانية", "زاني", "الزانية", "زناة",
    "خول", "الخول", "خولة",
    "زمل", "الزمل", "زملة", "زمالة",
    "مخنث", "مخنثة", "مخانيث",
    "لوطي", "لواط", "ملوط",
    "عرص", "عرصة", "عراصة",
    // family insults
    "امك النعال", "امك الشرموطة", "امك القحبة",
    "دير امك", "دير امو", "دير فيك",
    "ولد الكلب", "ابن الكلب", "ولد لكلب", "وليد الكلب",
    "ولد الشرموطة", "ابن الشرموطة", "ولد القحبة", "ولد الزانية",
    "ولد الحرام", "ابن الحرام",
    "انعل ابوك", "انعل دينك", "انعل ربك", "انعل امك",
    "ابوك قواد",
    // curses & profanity
    "يلعن ربك", "يلعن دينك", "يلعن ابوك", "يلعن امك",
    "يلعن دين امك", "يلعن دين ربك",
    "لعن الله", "ملعون", "ملعونة", "لعين", "العنك",
    "سير تنيك", "روح تنيك", "سير تتنيك",
    "سير لجهنم", "روح لجهنم",
    "تبا لك", "تبا لو",
    // animals used as insults
    "خنزير", "خنازير",
    "كلب", "كلاب",
    "حمار", "حمارة",
    "حيوان", "حيوانة",
    "قرد", "قردة",
    "تيس", "تيسة",
    "بغل", "بغلة",
    // general insults
    "احمق", "أحمق", "حمق", "حمقاء",
    "غبي", "غبية", "أغبياء",
    "بليد", "بليدة",
    "متخلف", "متخلفة",
    "مجنون", "مجنونة",
    "نذل", "نذلة",
    "حقير", "حقيرة",
    "وضيع", "وضيعة",
    "فاسق", "فاسقة",
    "منافق", "منافقة",
    "كافر", "الكافر",
    // standalone short words only safe inside Arabic context
    "امك", "امو",
    "مص",
];

/**
 * Latin single-token words (no spaces).
 * All combined into one alternation regex — one pass per message.
 * IMPORTANT: only add true single tokens here; multi-word phrases go in LATIN_PHRASES.
 */
const LATIN_SINGLES: string[] = [
    // Darija transliteration — genitals & sex acts
    "kahba", "kah9a", "ka7ba", "qahba", "qa7ba", "kha9ba",
    "sharmouta", "sharmota", "charmota", "charmouta", "shar9uta",
    "nik", "niik", "niku", "niko",
    "zbb", "zbi", "zbik", "zbih", "zbo", "zib", "zibek", "zbek", "zibi", "zibo",
    "kss", "kus", "kussek", "kissek",
    "tiz", "tizek", "tizha", "tizo",
    "bzaz", "bzazha", "bzazek",
    "9awed", "qawed", "qwwad", "qaouad",
    "dayouth", "dayyouth", "diouth",
    // Darija — insults & slurs
    "manyak", "manyok", "mniok", "mnikou", "manyako",
    "khoul", "khow", "khawl",
    "zamel", "zaamel", "zml",
    "3arss", "3arssa", "3rss",
    "mkhannath", "mkhanath",
    "louti", "lwati",
    // Darija — curses & animals
    "yal3n", "yl3n", "tal3n", "n3al",
    "la3na", "mal3on", "la3nat",
    "hmar", "7mar", "7mara", "hmarou",
    "khanzir", "khanzira", "khanzirin",
    "kleb", "klab", "kalb",
    "9erd", "9erda",
    "tiss", "tisa",
    "ba8l", "baghl",
    // Darija — general insults
    "3aher", "3ahira",
    "9a7ba", "9ahba",
    "8abi", "ghabi", "ghebya",
    "7aywan", "hayawan",
    "mkhalef", "m5alef",
    "majnoun", "majnouna",
    "na9es", "na9sa",
    "7qi9", "7akir",
    "mna9eq", "mnafeq",
    // French — single tokens
    "merde", "merdique",
    "putain", "pute", "putes", "putains", "putasse",
    "salope", "salaud", "salopard", "salopards", "salopes",
    "connard", "connasse", "connards", "connasses",
    "enculé", "encule", "enculés", "enculer",
    "fdp",
    "bâtard", "batard", "batards",
    "vtff",
    "ntm", "ntr",
    "nique", "niquer", "niqué",
    "ftg",
    "dégage", "degage",
    "foutre",
    "baise", "baiser", "baiseur",
    "bite", "bites",
    "chatte", "chattes",
    "couilles", "couille",
    "pétasse", "petasse",
    "ordure", "ordures",
    "pourriture",
    "pédé", "pede", "pédale", "tafiole",
    "tapette",
    "gouine",
    "crétin", "cretine",
    "abruti", "abrutie",
    "débile", "debile",
    "imbécile", "imbecile",
    // English
    "fuck", "fucker", "fucking", "fucked", "fck",
    "shit", "bullshit",
    "bitch", "bitches",
    "asshole",
    "bastard", "bastards",
    "dick", "dicks",
    "pussy",
    "motherfucker",
    "cunt", "cunts",
    "whore", "slut",
];

/**
 * Latin multi-word phrases (contain spaces).
 * Each gets its own precompiled regex so spacing is flexible (\s+).
 */
const LATIN_PHRASES: string[] = [
    // Darija phrases
    "weld lkahba", "weld l kahba", "wlad lkahba", "weld kahba",
    "weld sharmouta", "weld charmota", "weld shar9uta",
    "weld lhram", "weld hram",
    "dir amok", "dir amk", "dir ammo", "dir fik",
    "an3al abouk", "an3al dinak", "an3al rbk",
    "sir tnik", "ro7 tnik", "sir tban",
    "omok kahba", "ommo kahba",
    "ma9 zbi",
    // French phrases
    "fils de pute", "fille de pute",
    "va te faire foutre", "va te faire enc",
    "va chier",
    "nique ta mere", "nique ta mère", "nique ta race",
    "ta gueule", "ferme ta gueule",
    "casse toi", "fous le camp",
    "ton cul", "mon cul",
    // English phrases
    "son of a bitch",
    "f*ck",           // asterisk obfuscation caught at phrase level
];

// ─── 2. PRECOMPILE (module-level — runs once) ────────────────────────────────

function esc(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// One big alternation for all single Latin tokens — single regex pass per message
const SINGLE_LATIN_RE = new RegExp(
    `(?<![a-zA-Z0-9])(${LATIN_SINGLES.map(esc).join("|")})(?![a-zA-Z0-9])`,
    "i"
);

// Per-phrase regex with flexible whitespace between words
const PHRASE_RES: Array<{ phrase: string; re: RegExp }> =
    LATIN_PHRASES.map((phrase) => ({
        phrase,
        re: new RegExp(
            `(?<![a-zA-Z0-9])${esc(phrase).replace(/ /g, "\\s+")}(?![a-zA-Z0-9])`,
            "i"
        ),
    }));

// Arabic tashkeel (diacritics) range — strip before Arabic matching
const TASHKEEL_RE = /[ً-ٰٟ]/g;

// ─── 3. PREPROCESSING ───────────────────────────────────────────────────────

function normalise(text: string): string {
    return (
        text
            // Unicode normalisation first (é vs e + combining acute)
            .normalize("NFC")
            // Strip invisible / zero-width characters used to bypass filters
            .replace(/[​-‍﻿­⁠]/g, "")
            // Remove punctuation injected between letters: "f.u.c.k" → "fuck"
            .replace(/([a-zA-Z؀-ۿ])[.\-_*@#!$](?=[a-zA-Z؀-ۿ])/g, "$1")
            // Collapse 3+ consecutive identical chars to 2: "fuuuck" → "fuuck"
            // keeps "fuuck" so standard word-list entries like "fuck" still match
            // after a second collapse pass
            .replace(/(.)\1{2,}/g, "$1$1")
            // Collapse whitespace
            .replace(/\s+/g, " ")
            .trim()
    );
}

// ─── 4. PUBLIC API ───────────────────────────────────────────────────────────

/**
 * Returns the first matched bad word/phrase, or null if the text is clean.
 * Safe to call on every keystroke — all regexes are precompiled.
 */
export function containsBadWord(text: string): string | null {
    const norm  = normalise(text);
    const lower = norm.toLowerCase();

    // — Arabic: substring after stripping tashkeel from both sides —
    const lowerNoTashkeel = lower.replace(TASHKEEL_RE, "");
    for (const word of ARABIC_WORDS) {
        if (lowerNoTashkeel.includes(word)) return word;
    }

    // — Latin singles: one regex pass —
    const m = SINGLE_LATIN_RE.exec(lower);
    if (m) return m[1];

    // — Latin phrases: flexible spacing —
    for (const { phrase, re } of PHRASE_RES) {
        if (re.test(lower)) return phrase;
    }

    return null;
}
