import { describe, expect, test } from 'bun:test';
import { markerImageCacheKey } from '../markerImageCacheKey';

describe('markerImageCacheKey', () => {
  test('uses four pipe-delimited segments with empty strings for missing fields', () => {
    expect(markerImageCacheKey({ uri: 'https://example.com/pin.png' })).toBe(
      'https://example.com/pin.png|||',
    );
  });

  test('includes all dimensions when present', () => {
    expect(
      markerImageCacheKey({
        uri: 'asset:/pin.png',
        width: 32,
        height: 24,
        scale: 2,
      }),
    ).toBe('asset:/pin.png|32|24|2');
  });

  test('preserves partial optional fields with empty placeholders', () => {
    expect(
      markerImageCacheKey({
        uri: 'asset:/pin.png',
        width: 32,
      }),
    ).toBe('asset:/pin.png|32||');
  });
});
