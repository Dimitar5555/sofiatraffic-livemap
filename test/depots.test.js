import { depots } from '../data/depots.js';
import { expect, test } from 'vitest';

test('each depot has required properties', () => {
    for (const depot in depots) {
        expect(depot).toHaveProperty('id');
        expect(typeof depot.id).toBe('string');

        expect(depot).toHaveProperty('name');
        expect(typeof depot.name).toBe('string');

        expect(depot).toHaveProperty('type');
        expect(['bus', 'tram', 'trolleybus']).toContain(depot.type);

        expect(depot).toHaveProperty('inv_number_ranges');
        if(typeof depot.inv_number_ranges === 'object') {
            expect(Array.isArray(depot.inv_number_ranges)).toBe(true);
            for(const range of depot.inv_number_ranges) {
                if (Array.isArray(range)) {
                    expect(range.length).toBe(2);
                    expect(typeof range[0]).toBe('number');
                    expect(typeof range[1]).toBe('number');
                    expect(range[0]).toBeLessThanOrEqual(range[1]);
                }
            }
        }

        expect(depot).toHaveProperty('geometry');
        expect(Array.isArray(depot.geometry)).toBe(true);
        for(const line of depot.geometry) {
            expect(Array.isArray(line)).toBe(true);
            for(const point of line) {
                expect(Array.isArray(point)).toBe(true);
                expect(point.length).toBe(2);
                expect(typeof point[0]).toBe('number');
                expect(typeof point[1]).toBe('number');
            }
        }
    }
});
