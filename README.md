# URL Percent Encoder

A tiny, zero-dependency ESM library that percent-encodes URI components with the correct reserved character set for each segment type (path, query, fragment), following RFC 3986.

## Usage

```js
import { encodePath, encodeQuery, encodeFragment } from 'url-percent-encoder';

encodePath('hello world/été');     // 'hello%20world%2F%C3%A9t%C3%A9'
encodeQuery('name=John Doe');      // 'name=John%20Doe'
encodeFragment('section 2: refs'); // 'section%202%3A%20refs'
```

The exported names are: `encodePath`, `encodeQuery`, `encodeFragment`, `encode`, `UNRESERVED`, `RESERVED_SUB_DELIMS`.

## Why this exists

The built-in `encodeURIComponent` encodes *everything* except a small set of unreserved characters — including characters that RFC 3986 explicitly permits un-encoded in specific components (sub-delims, `:`, `@` in paths). The result is uglier and longer than necessary, and it breaks the common convention of keeping `&` and `=` verbatim in query strings.

This library gives you one function per component that applies the right "keep" set:

- `encodePath` keeps unreserved, sub-delims, `:`, and `@`. It encodes `/`, `?`, `#` so the result is safe inside a single path segment.
- `encodeQuery` and `encodeFragment` keep unreserved and sub-delims only. They encode `:`, `@`, `/`, `?`, `#` — stricter than the RFC's maximum allowance, but the safe default that won't confuse generic parsers.

The trade-off: query and fragment encoding here is deliberately conservative. If you need `/`, `:`, or `@` left verbatim in a query or fragment, this library is not the right tool.

## Edge cases worth knowing

- **Already-encoded input is not detected.** Feeding `%41` to any of these functions will produce `%2541` (the `%` gets encoded). These functions encode raw text; they do not re-encode or pass through existing percent-escapes. Don't double-process.
- **Lone surrogates** (valid in ECMAScript strings, invalid in strict UTF-8) are encoded as a 3-byte CESU-8-style sequence rather than throwing. Most callers will never hit this; it's documented so the behaviour is predictable.
- **Astral-plane characters** (emoji, musical symbols, etc.) are correctly encoded as 4-byte UTF-8 sequences.
