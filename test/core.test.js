import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodePath, encodeQuery, encodeFragment, encode, UNRESERVED, RESERVED_SUB_DELIMS } from '../src/index.js';

test('encodePath leaves unreserved characters untouched', () => {
  assert.equal(encodePath('AZaz09-._~'), 'AZaz09-._~');
});

test('encodePath keeps sub-delims, colon, and at-sign', () => {
  assert.equal(encodePath("!$&'()*+,;=:@"), "!$&'()*+,;=:@");
});

test('encodePath encodes the structural delimiters / ? #', () => {
  assert.equal(encodePath('/?#'), '%2F%3F%23');
});

test('encodePath encodes space and other non-unreserved ASCII', () => {
  assert.equal(encodePath(' '), '%20');
  assert.equal(encodePath('"'), '%22');
  assert.equal(encodePath('<'), '%3C');
  assert.equal(encodePath('>'), '%3E');
  assert.equal(encodePath('\\'), '%5C');
  assert.equal(encodePath('^'), '%5E');
  assert.equal(encodePath('`'), '%60');
  assert.equal(encodePath('{'), '%7B');
  assert.equal(encodePath('|'), '%7C');
  assert.equal(encodePath('}'), '%7D');
});

test('encodePath UTF-8 encodes non-ASCII characters', () => {
  assert.equal(encodePath('é'), '%C3%A9');
  assert.equal(encodePath('€'), '%E2%82%AC');
  assert.equal(encodePath('文'), '%E6%96%87');
});

test('encodePath handles an empty string', () => {
  assert.equal(encodePath(''), '');
});

test('encodePath preserves an already percent-encoded sequence as literal characters', () => {
  // % is not unreserved, so it is itself encoded. Callers should NOT
  // double-encode by feeding already-encoded input.
  assert.equal(encodePath('%41'), '%2541');
});

test('encodePath handles a surrogate pair (astral plane)', () => {
  assert.equal(encodePath('𝄞'), '%F0%9D%84%9E');
});

test('encodePath encodes a lone high surrogate as a 3-byte sequence', () => {
  // Lone surrogate is a valid JS string; we encode its code unit rather than throw.
  const lone = String.fromCharCode(0xD800);
  assert.equal(encodePath(lone), '%ED%A0%80');
});

test('encodeQuery leaves unreserved characters untouched', () => {
  assert.equal(encodeQuery('AZaz09-._~'), 'AZaz09-._~');
});

test('encodeQuery keeps sub-delims verbatim', () => {
  assert.equal(encodeQuery("!$&'()*+,;="), "!$&'()*+,;=");
});

test('encodeQuery encodes / : @ ? #', () => {
  assert.equal(encodeQuery('/:@?#'), '%2F%3A%40%3F%23');
});

test('encodeQuery UTF-8 encodes non-ASCII', () => {
  assert.equal(encodeQuery('café'), 'caf%C3%A9');
});

test('encodeQuery handles an empty string', () => {
  assert.equal(encodeQuery(''), '');
});

test('encodeFragment leaves unreserved characters untouched', () => {
  assert.equal(encodeFragment('AZaz09-._~'), 'AZaz09-._~');
});

test('encodeFragment keeps sub-delims verbatim', () => {
  assert.equal(encodeFragment("!$&'()*+,;="), "!$&'()*+,;=");
});

test('encodeFragment encodes / : @ ? #', () => {
  assert.equal(encodeFragment('/:@?#'), '%2F%3A%40%3F%23');
});

test('encodeFragment UTF-8 encodes non-ASCII', () => {
  assert.equal(encodeFragment('東京'), '%E6%9D%B1%E4%BA%AC');
});

test('encodeFragment handles an empty string', () => {
  assert.equal(encodeFragment(''), '');
});

test('generic encode keeps unreserved and predicate-allowed chars', () => {
  assert.equal(encode('a b', (c) => c === ' '), 'a b');
  assert.equal(encode('a/b', (c) => false), 'a%2Fb');
});

test('UNRESERVED and RESERVED_SUB_DELIMS are exposed and usable', () => {
  assert.equal(UNRESERVED.test('A'), true);
  assert.equal(UNRESERVED.test(' '), false);
  assert.equal(RESERVED_SUB_DELIMS.test('!'), true);
  assert.equal(RESERVED_SUB_DELIMS.test('/'), false);
});

test('mixed realistic path segment', () => {
  assert.equal(encodePath('hello world/été'), 'hello%20world%2F%C3%A9t%C3%A9');
});

test('mixed realistic query value', () => {
  assert.equal(encodeQuery('name=John Doe&city=New York'), 'name=John%20Doe&city=New%20York');
});

test('mixed realistic fragment', () => {
  assert.equal(encodeFragment('section 2: figures & tables'), 'section%202%3A%20figures%20&%20tables');
});
