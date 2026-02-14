import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';

import { depots_data } from '/data/depots';

import { MIN_ACTIVE_SPEED } from './config';
import { calculate_bearing, calculate_distance, proper_inv_number_for_sorting } from './utils';
import { find_vehicle_in_cache } from './cache';

function is_vehicle_in_depot(type, coords) {
    return depots_data.some(depot => 
        depot.polygon
        && (depot.type == type || depot.type.includes(type))
        && booleanPointInPolygon(coords, depot.polygon)
    )
}

export function handle_tram_compositions(cache, data_source) {
    for(const composition of tram_compositions) {
        const [first_wagon, second_wagon] = composition;

        const first_wagon_entry = find_vehicle_in_cache(cache, false, { inv_number: first_wagon, type: 'tram' });
        const second_wagon_entry = find_vehicle_in_cache(cache, false, { inv_number: second_wagon, type: 'tram' });

        const composition_inv_number = `${first_wagon}/${(second_wagon % 100).toString().padStart(2, '0')}`;
        const composition_entry = find_vehicle_in_cache(cache, false, { cgm_id: `composition_${first_wagon}_${second_wagon}` });
        if(!first_wagon_entry || !second_wagon_entry && data_source == 'avl') {
            if(first_wagon_entry) {
                first_wagon_entry.hidden = false;
            }
            if(second_wagon_entry) {
                second_wagon_entry.hidden = false;
            }
            if(composition_entry) {
                composition_entry.hidden = true;
            }
            continue;
        }

        if(data_source == 'avl') {
            const first_wagon_coords = first_wagon_entry.coords;
            const second_wagon_coords = second_wagon_entry.coords;
            const distance = calculate_distance(first_wagon_coords, second_wagon_coords);
            if(distance > 500) {
                if(first_wagon_entry) {
                    first_wagon_entry.hidden = false;
                }
                if(second_wagon_entry) {
                    second_wagon_entry.hidden = false;
                }
                if(composition_entry) {
                    composition_entry.hidden = true;
                }
                continue;
            }
        }

        if(!composition_entry) {
            const copy = JSON.parse(JSON.stringify(first_wagon_entry));
            copy.inv_number = composition_inv_number;
            copy.full_inv_number = `${first_wagon}+${second_wagon}`;
            copy.cgm_id = `composition_${first_wagon}_${second_wagon}`;
            cache.set(copy.cgm_id, copy);
        }
        else {
            const copy_properties = [
                'cgm_route_id',
                'route_ref',
                'reduce_marker',
                'speed',
                'old_coords',
                'coords',
                'bearing',
                'next_stop',
                'destination_stop',
                'scheduled_time',
                'timestamp'
            ];
            for(const prop of copy_properties) {
                composition_entry[prop] = first_wagon_entry[prop];
            }
        }
        if(first_wagon_entry) {
            first_wagon_entry.hidden = true;
        }
        if(second_wagon_entry) {
            second_wagon_entry.hidden = true;
        }
    }
}

export function add_to_cache(new_vehicle, tables_to_update, cache) {
    let vehicle = cache.get(new_vehicle.cgm_id);

    // const same_timestamp = cache_entry && cache_entry.timestamp === vehicle.timestamp;
    // const same_coords = cache_entry && cache_entry.coords[0] === vehicle.coords[0] && cache_entry.coords[1] === vehicle.coords[1];

    // if(same_timestamp && same_coords) {
    //     return;
    // }

    if(vehicle && vehicle.hidden) {
        vehicle.hidden = false;
    }

    if(new_vehicle.type != 'bus' && typeof new_vehicle.route_ref === 'string' && new_vehicle.route_ref.endsWith('TM')) {
        new_vehicle.type = 'bus';
    }

    // if(new_vehicle.route_ref) {
    //     tables_to_update.add(`${vehicle.type}/${vehicle.route_ref}`);
    // }
    // else if(new_vehicle.route_ref == '') {
    //     tables_to_update.add(`${vehicle.type}/null`);
    // }
    
    if(!vehicle) {
        new_vehicle.hidden = false;
        cache.set(new_vehicle.cgm_id, new_vehicle);
    }
    else {
        const old_coords = vehicle.coords;
        const old_type = vehicle.type;
        const new_type = new_vehicle.type || old_type;
        const old_route_ref = vehicle.route_ref;
        const new_route_ref = new_vehicle.route_ref || old_route_ref;
        vehicle.old_coords = old_coords;
        Object.assign(vehicle, new_vehicle);

        if(old_route_ref != new_route_ref || old_type != new_type) {
            tables_to_update.add(`${old_type}/${old_route_ref}`);
            tables_to_update.add(`${new_type}/${new_route_ref}`);
        }

        if(MIN_ACTIVE_SPEED <= vehicle.speed) {
            vehicle.bearing = calculate_bearing(old_coords, new_vehicle.coords);
        }
        else {
            vehicle.bearing = 0;
        }
    }
}

export function find_vehicle_in_cache(cache, multiple_results, params) {
    function filter_by_params(vehicle, params) {
        for(const key in params) {
            if(key == 'inv_number') {
                if(proper_inv_number_for_sorting(vehicle.inv_number) != params.inv_number) {
                    return false;
                }
                continue;
            }
            if(vehicle[key] != params[key]) {
                return false;
            }
        }
        return true;
    }
    if(multiple_results) {
        return [...cache.values()]
        .filter(v => filter_by_params(v, params));
    }
    return [...cache.values()]
    .find(v => filter_by_params(v, params));
}
