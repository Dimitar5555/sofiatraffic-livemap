import { models } from '../data/models.js';
import { expect, test } from 'vitest';

test('only known types are present in models', () => {
    const known_types = new Set(['bus', 'tram', 'trolleybus']);
    for (const type in models) {
        expect(known_types.has(type)).toBe(true);
    }
});

test('models have correct structure', () => {
    for (const type in models) {
        for (const model of models[type]) {
            expect(model).toHaveProperty('id');
            expect(typeof model.id).toBe('string');

            expect(model).toHaveProperty('name');
            expect(typeof model.name).toBe('string');

            if(type === 'tram') {
                expect(model).toHaveProperty('gauge');
                expect(typeof model.gauge).toBe('number');
            }
            else {
                expect(model).not.toHaveProperty('gauge');
            }

            expect(model).toHaveProperty('inv_number_ranges');
            expect(Array.isArray(model.inv_number_ranges)).toBe(true);
            for (const range of model.inv_number_ranges) {
                if (Array.isArray(range)) {
                    expect(range.length).toBe(2);
                    expect(typeof range[0]).toBe('number');
                    expect(typeof range[1]).toBe('number');
                    expect(range[0]).toBeLessThanOrEqual(range[1]);
                }
                else {
                    expect(typeof range).toBe('number');
                }
            }
        }
    }
});

test('only allowed extras are present in models', () => {
    const allowed_extras = new Set(['ac', 'low_floor', 'double_decker']);
    for (const type in models) {
        for (const model of models[type]) {
            if (!model.extras) continue;
            for (const extra of model.extras) {
                expect(allowed_extras.has(extra)).toBe(true);
            }
        }
    }
});
