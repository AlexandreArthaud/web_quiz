function shuffle(array) {
  let currentIndex = array.length;
  
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

function getLanguageCodeFromName(name) {
    const languageMap = {
        /* MODERN */
        'english': 'en',
        'chinese': 'zh',
        'hindi': 'hi',
            'urdu': 'ur',
        'spanish': 'es',
        'french': 'fr',
        'arabic': 'ar',
        'bengali': 'bn',
        'portuguese': 'pt',
        'russian': 'ru',
        'indonesian': 'id',
        'german': 'de',
        'japanese': 'ja',
        'turkish': 'tr',
        'swahili': 'sw',
        'vietnamese': 'vi',
        'tagalog': 'tl',
        'korean': 'ko',
            'hangul': 'ko',
        'persian': 'fa',
        'italian': 'it',
        'thai': 'th',
        'polish': 'pl',
        'nepali': 'ne',
        'amharic': 'am',
        'romanian': 'ro',
        'dutch': 'nl',
        'greek': 'el',
        'swedish': 'sv',
        'finnish': 'fi',
        'icelandic': 'is',

        /* ANCIENT */
        'latin': 'la,'
    }

    const lowerName = name.toLowerCase();
    for (const [key, code] of Object.entries(languageMap)) {
        if (lowerName.includes(key)) {
            return code;
        }
    }
}

function generateHangul(choseong, jungseong, jongseong = '') {
    // Unicode base code for Hangul syllables
    const baseCode = 0xAC00;
    
    // List of Hangul initial consonants (Choseong)
    const choseongs = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    
    // List of Hangul medial vowels (Jungseong)
    const jungseongs = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
    
    // List of Hangul final consonants (Jongseong)
    const jongseongs = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
    
    // Get the index of each jamo
    const choseongIndex = choseongs.indexOf(choseong);
    const jungseongIndex = jungseongs.indexOf(jungseong);
    const jongseongIndex = jongseongs.indexOf(jongseong);
    
    // Validate that each jamo exists in the respective list
    if (choseongIndex === -1 || jungseongIndex === -1 || jongseongIndex === -1) {
        console.log(`Tried to combine:\n
                     1. ${choseong}, index:${choseongIndex} \n
                     2. ${jungseong}, ${jungseongIndex} \n
                     3. ${jongseong}, ${jongseongIndex}`);
        throw new Error("Invalid jamo input");
    }
    
    // Calculate the Unicode code point for the Hangul syllable
    const syllableCodePoint = baseCode +
        (choseongIndex * 21 * 28) +  // Choseong index multiplied by number of Jungseong and Jongseong
        (jungseongIndex * 28) +      // Jungseong index multiplied by number of Jongseong
        jongseongIndex;              // Jongseong index
    
    // Convert the code point to a character
    return String.fromCharCode(syllableCodePoint);
}

function generateCombinations(inputs) {
    // Recursive function to expand all combinations
    function expand(str) {
        // Handle double parentheses ((a/e)) - mandatory choices
        let match = str.match(/\(\(([^()]+)\)\)/);
        if (match) {
            const options = match[1].split('/');
            return options.flatMap(option => expand(str.replace(match[0], option)));
        }

        // Handle single parentheses (s) or (ed/ing) - optional content or choices
        match = str.match(/\(([^()]+)\)/);
        if (match) {
            const options = match[1].split('/');
            // Include an empty string option to treat the whole content as optional
            const variants = options.concat(['']);
            return variants.flatMap(option => expand(str.replace(match[0], option)));
        }

        // Handle word pairs with slashes outside parentheses, e.g., gray/grey
        match = str.match(/\b(\w+)\/(\w+)\b/);
        if (match) {
            return [expand(str.replace(match[0], match[1])), expand(str.replace(match[0], match[2]))].flat();
        }

        // No more patterns to expand, return the final string
        return [str.trim()];
    }

    // Process each input string and gather all combinations
    const results = inputs.flatMap(expand);

    // Return unique results to avoid duplicates
    return [...new Set(results)];
}
