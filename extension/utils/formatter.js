/*
 * linkedin paste helpers:
 * - unicode bold/italic/code and list formatting for copy/paste
 * - updates the post textarea by transforming the selected text
 */
(function (global) {
  // mathematical sans-serif BOLD (A–Z, a–z, 0–9)
  const BOLD_UPPER = 0x1d5d4;
  const BOLD_LOWER = 0x1d5ee;
  const BOLD_DIGIT = 0x1d7ec;

  // mathematical sans-serif ITALIC (A–Z, a–z)
  // digits stay ascii because they are not supported by Unicode italic style
  const ITALIC_UPPER = 0x1d608;
  const ITALIC_LOWER = 0x1d622;

  // ONE CHARACTER: map one styled unicode to plain ascii when possible
  function decodeCharToAscii(ch) {
    const cp = ch.codePointAt(0);

    if (cp >= BOLD_UPPER && cp <= BOLD_UPPER + 25) {
      return String.fromCharCode(65 + (cp - BOLD_UPPER));
    }
    if (cp >= BOLD_LOWER && cp <= BOLD_LOWER + 25) {
      return String.fromCharCode(97 + (cp - BOLD_LOWER));
    }
    if (cp >= BOLD_DIGIT && cp <= BOLD_DIGIT + 9) {
      return String.fromCharCode(48 + (cp - BOLD_DIGIT));
    }
    if (cp >= ITALIC_UPPER && cp <= ITALIC_UPPER + 25) {
      return String.fromCharCode(65 + (cp - ITALIC_UPPER));
    }
    if (cp >= ITALIC_LOWER && cp <= ITALIC_LOWER + 25) {
      return String.fromCharCode(97 + (cp - ITALIC_LOWER));
    }

    return ch;
  }

  // FULL STRING: normalize to plain ascii characters
  function decodeToAscii(str) {
    let out = "";
    for (const ch of str) {
      out += decodeCharToAscii(ch);
    }
    return out;
  }

  // ONE CHARACTER: map one ascii to the unicode BOLD sans range
  function encodeBoldChar(ch) {
    const cp = ch.codePointAt(0);
    if (cp >= 65 && cp <= 90) {
      return String.fromCodePoint(BOLD_UPPER + (cp - 65));
    }
    if (cp >= 97 && cp <= 122) {
      return String.fromCodePoint(BOLD_LOWER + (cp - 97));
    }
    if (cp >= 48 && cp <= 57) {
      return String.fromCodePoint(BOLD_DIGIT + (cp - 48));
    }
    return ch;
  }

  // ONE CHARACTER: map one ascii to the unicode ITALIC sans range
  function encodeItalicChar(ch) {
    const cp = ch.codePointAt(0);
    if (cp >= 65 && cp <= 90) {
      return String.fromCodePoint(ITALIC_UPPER + (cp - 65));
    }
    if (cp >= 97 && cp <= 122) {
      return String.fromCodePoint(ITALIC_LOWER + (cp - 97));
    }
    return ch;
  }

  // FULL STRING: convert all supported characters to BOLD sans unicode
  function encodeBold(str) {
    let out = "";
    for (const ch of str) {
      out += encodeBoldChar(ch);
    }
    return out;
  }

  // FULL STRING: convert all supported characters to ITALIC sans unicode
  function encodeItalic(str) {
    let out = "";
    for (const ch of str) {
      out += encodeItalicChar(ch);
    }
    return out;
  }

  // FULL STRING: detect whether the whole string is already encoded as BOLD sans
  function isBoldSansString(str) {
    const plain = decodeToAscii(str);
    return encodeBold(plain) === str;
  }

  // FULL STRING: detect whether the whole string is already encoded as ITALIC sans
  function isItalicSansString(str) {
    const plain = decodeToAscii(str);
    return encodeItalic(plain) === str;
  }

  // toggle BOLD on a selected segment while preserving selection bounds
  function applyBold(text, selStart, selEnd) {
    const selected = text.slice(selStart, selEnd);
    if (!selected) {
      return null;
    }

    const before = text.slice(0, selStart);
    const after = text.slice(selEnd);

    if (isBoldSansString(selected)) {
      const plain = decodeToAscii(selected);
      const value = before + plain + after;
      return {
        value,
        selectionStart: selStart,
        selectionEnd: selStart + plain.length,
      };
    }

    const plain = decodeToAscii(selected);
    const out = encodeBold(plain);
    const value = before + out + after;
    return {
      value,
      selectionStart: selStart,
      selectionEnd: selStart + out.length,
    };
  }

  // toggle ITALIC on a selected segment while preserving selection bounds
  function applyItalic(text, selStart, selEnd) {
    const selected = text.slice(selStart, selEnd);
    if (!selected) {
      return null;
    }

    const before = text.slice(0, selStart);
    const after = text.slice(selEnd);

    if (isItalicSansString(selected)) {
      const plain = decodeToAscii(selected);
      const value = before + plain + after;
      return {
        value,
        selectionStart: selStart,
        selectionEnd: selStart + plain.length,
      };
    }

    const plain = decodeToAscii(selected);
    const out = encodeItalic(plain);
    const value = before + out + after;
    return {
      value,
      selectionStart: selStart,
      selectionEnd: selStart + out.length,
    };
  }

  const FENCE_RE = /^```\r?\n([\s\S]*)\r?\n```$/;

  // wrap a selection in triple-backtick fences (CODE BLOCK) or unwrap if already fenced
  function applyCodeFence(text, selStart, selEnd) {
    const before = text.slice(0, selStart);
    const after = text.slice(selEnd);
    const selected = text.slice(selStart, selEnd);

    if (FENCE_RE.test(selected)) {
      const inner = selected.replace(FENCE_RE, "$1");
      const value = before + inner + after;
      return {
        value,
        selectionStart: selStart,
        selectionEnd: selStart + inner.length,
      };
    }

    // unwrap when the selection is inside an existing fenced CODE block
    if (
      (before.endsWith("```\n") && after.startsWith("\n```")) ||
      (before.endsWith("```\r\n") && after.startsWith("\r\n```"))
    ) {
      const opening = before.endsWith("```\r\n") ? "```\r\n" : "```\n";
      const closing = opening === "```\r\n" ? "\r\n```" : "\n```";

      const inner = selected;
      const value =
        before.slice(0, before.length - opening.length) +
        inner +
        after.slice(closing.length);

      const newStart = selStart - opening.length;
      return {
        value,
        selectionStart: newStart,
        selectionEnd: newStart + inner.length,
      };
    }

    if (selected.length === 0) {
      const insertion = "```\n\n```";
      const value = before + insertion + after;
      const caret = selStart + 4;
      return {
        value,
        selectionStart: caret,
        selectionEnd: caret,
      };
    }

    const wrapped = "```\n" + selected + "\n```";
    const value = before + wrapped + after;
    return {
      value,
      selectionStart: selStart + 4,
      selectionEnd: selStart + 4 + selected.length,
    };
  }

  // regexes to strip (and recognize) known list prefixes
  // order matters: roman comes before alpha-dot so "i. ii." strips as roman
  const STRIP_PREFIX_RES = [
    { kind: "roman_lower_dot", re: /^\s*[ivxlcdm]+\.\s+/ }, // i. ii. iii.
    { kind: "roman_upper_dot", re: /^\s*[IVXLCDM]+\.\s+/ }, // I. II. III.
    { kind: "numeric_dot", re: /^\s*\d+\.\s+/ },            // 1. 2. 3.
    { kind: "numeric_rparen", re: /^\s*\d+\)\s+/ },         // 1) 2) 3)
    { kind: "numeric_paren", re: /^\s*\(\d+\)\s+/ },        // (1) (2) (3)
    { kind: "alpha_lower_dot", re: /^\s*[a-z]\.\s+/ },      // a. b. c.
    { kind: "alpha_lower_rparen", re: /^\s*[a-z]\)\s+/ },   // a) b) c)
    { kind: "alpha_lower_paren", re: /^\s*\([a-z]\)\s+/ },  // (a) (b) (c)
    { kind: "alpha_upper_rparen", re: /^\s*[A-Z]\)\s+/ },   // A) B) C)
    { kind: "bullet", re: /^\s*[•\-\*]\s+/ },               // • - *
  ];

  // supported list styles are defined by the same patterns
  const SUPPORTED_LIST_KINDS = new Set(STRIP_PREFIX_RES.map((x) => x.kind));

  // remove one known list prefix from the start of a line
  function stripAnyListPrefix(line) {
    let s = line;
    for (const { re } of STRIP_PREFIX_RES) {
      if (re.test(s)) {
        return s.replace(re, "");
      }
    }
    return line;
  }

  // infer the dominant list kind when all selected lines match one style
  function detectListKind(lines) {
    if (!lines.length) {
      return null;
    }

    for (const { kind, re } of STRIP_PREFIX_RES) {
      if (lines.every((line) => re.test(line))) {
        return kind;
      }
    }

    return null;
  }

  // convert a positive integer into a roman numeral label
  function intToRoman(n) {
    if (n < 1) {
      return "I";
    }
    const pairs = [
      [1000, "M"],
      [900, "CM"],
      [500, "D"],
      [400, "CD"],
      [100, "C"],
      [90, "XC"],
      [50, "L"],
      [40, "XL"],
      [10, "X"],
      [9, "IX"],
      [5, "V"],
      [4, "IV"],
      [1, "I"],
    ];
    let rest = n;
    let out = "";
    for (const [v, sym] of pairs) {
      while (rest >= v) {
        out += sym;
        rest -= v;
      }
    }
    return out;
  }

  // build the raw per-line prefix for non-aligned list styles
  function prefixForLine(kind, index) {
    const n = index + 1;
    switch (kind) {
      case "bullet":
        return "• ";
      case "numeric_dot":
        return `${n}. `;
      case "numeric_rparen":
        return `${n}) `;
      case "numeric_paren":
        return `(${n}) `;
      case "alpha_lower_dot":
        return `${String.fromCharCode(97 + (index % 26))}. `;
      case "alpha_lower_rparen":
        return `${String.fromCharCode(97 + (index % 26))}) `;
      case "alpha_lower_paren":
        return `(${String.fromCharCode(97 + (index % 26))}) `;
      case "alpha_upper_rparen":
        return `${String.fromCharCode(65 + (index % 26))}) `;
      case "roman_lower_dot":
        return `${intToRoman(n).toLowerCase()}. `;
      case "roman_upper_dot":
        return `${intToRoman(n)}. `;
      default:
        return "";
    }
  }

  // align numeric-style labels so line content starts at the same column
  // # Example:
  /* "9.  line 9"
   * "10. line 10"
   */
  function buildNumericAlignedLines(plainLines, style) {
    const labels = plainLines.map((_, i) => {
      const n = i + 1;
      if (style === "dot") {
        return `${n}.`;
      }
      if (style === "rparen") {
        return `${n})`;
      }
      return `(${n})`;
    });
    const maxLabelLen = Math.max(1, ...labels.map((l) => l.length));
    return plainLines.map((line, i) => {
      const lab = labels[i];
      const gap = maxLabelLen - lab.length + 1;
      return lab + " ".repeat(gap) + line;
    });
  }

  // align roman labels so line content starts at the same column
  /* # Example:
   * "i.   line i"
   * "ii.  line ii"
   * "iii. line iii"
   */
  function buildRomanAlignedLines(plainLines, lowerCase) {
    const labels = plainLines.map((_, i) => {
      const rom = intToRoman(i + 1);
      return (lowerCase ? rom.toLowerCase() : rom) + ".";
    });
    const maxLabelLen = Math.max(1, ...labels.map((l) => l.length));
    return plainLines.map((line, i) => {
      const lab = labels[i];
      const gap = maxLabelLen - lab.length + 1;
      return lab + " ".repeat(gap) + line;
    });
  }

  // apply/toggle the selected list style across all selected lines
  function applyList(text, selStart, selEnd, kind) {
    if (!SUPPORTED_LIST_KINDS.has(kind)) {
      return null;
    }

    const selected = text.slice(selStart, selEnd);
    if (!selected) {
      return null;
    }

    const lines = selected.split(/\r?\n/);
    const before = text.slice(0, selStart);
    const after = text.slice(selEnd);
    const currentKind = detectListKind(lines);

    if (currentKind === kind) {
      const stripped = lines.map(stripAnyListPrefix).join("\n");
      const value = before + stripped + after;
      return {
        value,
        selectionStart: selStart,
        selectionEnd: selStart + stripped.length,
        toggledOff: true,
      };
    }

    const plainLines = lines.map(stripAnyListPrefix);
    let outLines;
    if (kind === "numeric_dot") {
      outLines = buildNumericAlignedLines(plainLines, "dot");
    } else if (kind === "numeric_rparen") {
      outLines = buildNumericAlignedLines(plainLines, "rparen");
    } else if (kind === "numeric_paren") {
      outLines = buildNumericAlignedLines(plainLines, "paren");
    } else if (kind === "roman_lower_dot") {
      outLines = buildRomanAlignedLines(plainLines, true);
    } else if (kind === "roman_upper_dot") {
      outLines = buildRomanAlignedLines(plainLines, false);
    } else {
      outLines = plainLines.map((line, i) => prefixForLine(kind, i) + line);
    }
    const out = outLines.join("\n");
    const value = before + out + after;
    return {
      value,
      selectionStart: selStart,
      selectionEnd: selStart + out.length,
      toggledOn: true,
    };
  }

  global.LinkedInPostFormatter = {
    applyBold,
    applyItalic,
    applyCodeFence,
    applyList,
  };
})(typeof self !== "undefined" ? self : this);
