import { booleanPointInPolygon } from '@turf/boolean-point-in-polygon';

import { depots_data } from '/data/depots';

import { MIN_ACTIVE_SPEED } from './config';
import { calculate_bearing, calculate_distance } from './utils';

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

        const first_wagon_entry = cache.find(entry => entry.inv_number == first_wagon && entry.type == 'tram');
        const second_wagon_entry = cache.find(entry => entry.inv_number == second_wagon && entry.type == 'tram');

        const composition_inv_number = `${first_wagon}/${(second_wagon % 100).toString().padStart(2, '0')}`;
        const composition_entry = cache.find(entry => entry.inv_number == composition_inv_number);

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
            cache.push(copy);
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

export function add_to_cache(vehicle, tables_to_update, cache) {
    let cache_entry = cache.find(entry => 
        entry.cgm_id === vehicle.cgm_id);

    const same_timestamp = cache_entry && cache_entry.timestamp === vehicle.timestamp;
    const same_coords = cache_entry && cache_entry.coords[0] === vehicle.coords[0] && cache_entry.coords[1] === vehicle.coords[1];

    if(same_timestamp && same_coords) {
        return;
    }

    if(vehicle.type != 'bus' && typeof vehicle.route_ref === 'string' && vehicle.route_ref.endsWith('TM')) {
        vehicle.type = 'bus';
    }

    if(vehicle.route_ref) {
        tables_to_update.add(`${vehicle.type}/${vehicle.route_ref}`);
    }
    else {
        tables_to_update.add(`${vehicle.type}/null`);
    }
    
    if(!cache_entry) {
        cache.push(vehicle);
    }
    else {
        const old_coords = cache_entry.coords;
        const old_type = cache_entry.type;
        const new_type = vehicle.type;
        const old_route_ref = cache_entry.route_ref;
        const new_route_ref = vehicle.route_ref;
        cache_entry.old_coords = old_coords;
        cache_entry = Object.assign(cache_entry, vehicle);

        if(old_route_ref != new_route_ref || old_type != new_type) {
            tables_to_update.add(`${old_type}/${old_route_ref}`);
            tables_to_update.add(`${new_type}/${new_route_ref}`);
        }

        if(MIN_ACTIVE_SPEED <= vehicle.speed) {
            cache_entry.bearing = calculate_bearing(old_coords, vehicle.coords);
        }
        else {
            cache_entry.bearing = 0;
        }
    }
}
