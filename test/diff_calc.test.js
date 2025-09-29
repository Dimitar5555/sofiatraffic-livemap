import { calculate_diff } from '../src/js/utils.js';
import { expect, test } from 'vitest'


test('returns null for non-number scheduled time', () => {
    expect(calculate_diff(null, 500)).toBeNull();
    expect(calculate_diff(undefined, 500)).toBeNull();
    expect(calculate_diff('string', 500)).toBeNull();
});

test('calculates difference without wrap-around', () => {
    expect(calculate_diff(300, 320)).toBe(20);
    expect(calculate_diff(600, 590)).toBe(-10);
    expect(calculate_diff(0, 10)).toBe(10);
    expect(calculate_diff(1439, 0)).toBe(1);
});

test('calculates difference with wrap-around', () => {
    expect(calculate_diff(1430, 10)).toBe(20); // Wraps around midnight
    expect(calculate_diff(10, 1430)).toBe(-20); // Wraps around midnight
    expect(calculate_diff(1380, 20)).toBe(80); // Wraps around midnight
    expect(calculate_diff(20, 1380)).toBe(-80); // Wraps around midnight
    expect(calculate_diff(0, 1440)).toBe(0); // Exact wrap-around
    expect(calculate_diff(1445, 5)).toBe(0); // Exact wrap-around with overflow
    expect(calculate_diff(5, 1450)).toBe(5);
    expect(calculate_diff(1450, 5)).toBe(-5);
});