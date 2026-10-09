/**
 * Character set of "unreserved" characters from RFC 3986, section 2.3.
 * These are safe in any component and are never percent-encoded.
 *
 * unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"
 */
export const UNRESERVED = /^[A-Za-z0-9._~-]$/u;

/**
 * The "sub-delims" set from RFC 3986, section 2.2.
 * These are reserved WITHIN a specific component (so whether they're
 * percent-encoded depends on the component), as distinct from gen-delims
 * which delimit the structure of a URI.
 *
 * sub-delims = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
 */
export const RESERVED_SUB_DELIMS = /^[!$&'()*+,;=]$/u;

const HEX = '0123456789ABCDEF';

function utf8Bytes(codePoint) {
  if (codePoint < 0x80) return [codePoint];
  if (codePoint < 0x800) return [
    (codePoint >> 6) | 0xC0,
    (codePoint & 0x3F) | 0x80,
  ];
  if (codePoint < 0x10000) return [
    (codePoint >> 12) | 0xE0,
    ((codePoint >> 6) & 0x3F) | 0x80,
    (codePoint & 0x3F) | 0x80,
  ];
  return [
    (codePoint >> 18) + 0xF0,
    ((codePoint >> 12) & 0x3F) + 0x80,
    ((codePoint >> 6) & 0x3F) + 0x80,
    (codePoint & 0x3F) + 0x80,
  ];
}

function codePointAt(str, i) {
  const code = str.charCodeAt(i);
  if (code >= 0xD800 && code <= 0xDBFF && i + 1 < str.length) {
    const low = str.charCodeAt(i + 1);
    if (low >= 0xDC00 && low <= 0xDFFF) {
      return [0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00), 2];
    }
  }
  return [code, 1];
}

/**
 * Percent-encode a string, leaving unreserved characters and a caller-specified
 * set of additional characters un-encoded.
 *
 * Non-ASCII characters are UTF-8 encoded before percent-encoding, as required
 * by RFC 3986, section 2.5. The spec is silent on lone surrogates (which
 * ECMAScript allows but UTF-8 proper does not); we encode the lone code unit
 * using CESU-8-ish 3-byte encoding rather than throwing, because throwing
 * on a valid JS string would be surprising. This is an edge case most callers
 * won't hit; it's documented here so the behaviour is predictable.
 *
 * @param {string} value
 * @param {(ch: string) => boolean} keepPredicate
 * @returns {string}
 */
export function encode(value, keepPredicate) {
  let out = '';
  const len = value.length;
  let i = 0;
  while (i < len) {
    const ch = value[i];
    if (UNRESERVED.test(ch) || keepPredicate(ch)) {
      out += ch;
      i++;
      continue;
    }
    const [codePoint, consumed] = codePointAt(value, i);
    const bytes = utf8Bytes(codePoint);
    for (const byte of bytes) {
      out += '%' + HEX[byte >> 4] + HEX[byte & 0xF];
    }
    i += consumed;
  }
  return out;
}

/**
 * Percent-encode for a path segment.
 *
 * pchar = unreserved / pct-encoded / sub-delims / ":" / "@"
 *
 * So unreserved, sub-delims, ":", and "@" are kept; everything else (including
 * "/", "?", and "#") is encoded, so a caller can safely embed the result inside
 * a single path segment without it being misread as a delimiter.
 *
 * @param {string} value
 * @returns {string}
 */
export function encodePath(value) {
  return encode(value, (ch) => RESERVED_SUB_DELIMS.test(ch) || ch === ':' || ch === '@');
}

/**
 * Percent-encode for a query component.
 *
 * In the absence of a strict sub-component grammar (we don't take a
 * query-internal separator scheme as input), we encode conservatively: we keep
 * unreserved characters and sub-delims, and encode "/", ":", "@", "?", and "#".
 *
 * This is stricter than RFC 3986 technically allows for a query (pchar also
 * permits "/", ":", and "@"), but the spec's allowance is a *maximum* — it says
 * these characters are permitted without escaping, not that they're safe. A
 * typical query string uses "&" and "=" as field delimiters and embeds values;
 * keeping sub-delims verbatim makes "&", "=", "+" survive so callers can build
 * application/x-www-form-urlencoded-like queries deliberately, while encoding
 * characters that would confuse generic parsers.
 *
 * @param {string} value
 * @returns {string}
 */
export function encodeQuery(value) {
  return encode(value, (ch) => RESERVED_SUB_DELIMS.test(ch));
}

/**
 * Percent-encode for a fragment component.
 *
 * Same conservative set as query: unreserved and sub-delims are kept; "/",
 * ":", "@", "?", and "#" are encoded. RFC 3986 technically permits "/", ":",
 * and "@" in a fragment, but encoding them keeps the fragment from being
 * misread by a naive parser and is the safe default.
 *
 * @param {string} value
 * @returns {string}
 */
export function encodeFragment(value) {
  return encode(value, (ch) => RESERVED_SUB_DELIMS.test(ch));
}
