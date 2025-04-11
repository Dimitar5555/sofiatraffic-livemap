function preprocess_vehicle(vehicle, timestamp) {
    if(are_coords_invalid([vehicle.latitude, vehicle.longitude])) {
        return false;
    }
    vehicle.type = vehicle.vehicleType;
    const cgm_types = {
        'bus': 'A',
        'trolley': 'TB',
        'tram': 'TM'
    };
    const cgm_route_id = `${cgm_types[vehicle.type]}${vehicle.line}`;
    const inv_number = determine_inv_number(vehicle);
    const type = vehicle.type;
    if(inv_number == '' || inv_number == 8888) {
        return false;
    }

    let route_ref = null;
    let reduce_marker = true;
    if(!is_vehicle_in_depot(type, [vehicle.latitude, vehicle.longitude])) {
        route_ref = routes.find(route => route.cgm_id === cgm_route_id)?.route_ref;
        reduce_marker = false;
    }

    return {
        inv_number,
        type,
        cgm_route_id,
        route_ref,
        reduce_marker,
        hidden: false,
        geo: {
            bearing: 0,
            speed: 0,
            prev: {
                coords: [0, 0],
                timestamp: null
            },
            curr: {
                coords: [vehicle.latitude, vehicle.longitude],
                timestamp: timestamp
            }
        }
    };
}

function is_vehicle_in_depot(type, coords) {
    return depots_data.some(depot => 
        depot.polygon
        && (depot.type == type || depot.type.includes(type))
        && turf.booleanPointInPolygon(coords, depot.polygon)
    )
}

function are_coords_invalid([lat, lon]) {
    return lat == 0 && lon == 0;
}

function handle_tram_compositions() {
    for(const composition of tram_compositions) {
        const [first_wagon, second_wagon] = composition;
        const first_wagon_entry = cache.find(entry => entry.inv_number == first_wagon);
        const second_wagon_entry = cache.find(entry => entry.inv_number == second_wagon);
        const composition_inv_number = `${first_wagon}+${second_wagon}`;
        const composition_entry = cache.find(entry => entry.inv_number == composition_inv_number);

        if(!first_wagon_entry || !second_wagon_entry) {
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

        const first_wagon_coords = first_wagon_entry.geo.curr.coords;
        const second_wagon_coords = second_wagon_entry.geo.curr.coords;
        const distance = caclulate_distance(first_wagon_coords, second_wagon_coords);
        if(distance > 500) {
            first_wagon_entry.hidden = false;
            second_wagon_entry.hidden = false;
            composition_entry.hidden = true;
            continue;
        }

        if(!composition_entry) {
            cache.push({
                inv_number: composition_inv_number,
                type: 'tram',
                cgm_route_id: first_wagon_entry.cgm_route_id,
                route_ref: first_wagon_entry.route_ref,
                reduce_marker: first_wagon_entry.reduce_marker,
                hidden: false,
                geo: {
                    bearing: 0,
                    speed: 0,
                    prev: {
                        coords: [0, 0],
                        timestamp: null
                    },
                    curr: {
                        coords: first_wagon_coords,
                        timestamp: first_wagon_entry.geo.curr.timestamp
                    }
                },
                marker: null
            });
        }
        else {
            composition_entry.cgm_route_id = first_wagon_entry.cgm_route_id;
            composition_entry.route_ref = first_wagon_entry.route_ref;
            composition_entry.reduce_marker = first_wagon_entry.reduce_marker;
            composition_entry.geo.speed = first_wagon_entry.geo.speed;
            composition_entry.geo.bearing = first_wagon_entry.geo.bearing;
            composition_entry.geo.prev = composition_entry.geo.curr;
            composition_entry.geo.curr = first_wagon_entry.geo.curr;
        }

        first_wagon_entry.hidden = true;
        second_wagon_entry.hidden = true;
    }
}

function determine_inv_number(vehicle) {
    function is_fake_trolley(type, inv_number) {
        const inv_ranges = [[5001, 5015], [5031, 5064], [2501, 2505], [1703, 1703]];
        const is_inv_in_range = inv_ranges.some(([lower_bound, upper_bound]) => lower_bound <= inv_number && inv_number <= upper_bound);
        return type == 'trolley' && is_inv_in_range;
    }

    const inv_number = Number(vehicle.vehicleId.replace(/[a-z]/gi, ''));

    if(is_fake_trolley(vehicle.type, inv_number)) {
        vehicle.type = 'bus';
        // Avoid conflicts between Tramkar ebuses and Malashevtsi buses
        if(2501 <= inv_number && inv_number <= 2505) {
            return inv_number * 10;
        }
    }
    return inv_number;
}

function add_to_cache(vehicle, tables_to_update) {
    let cache_entry = cache.find(entry => entry.type === vehicle.type && entry.inv_number === vehicle.inv_number);
    
    let changed_state = false;
    if(!cache_entry) {
        cache.push(vehicle);
        if(vehicle.route_ref) {
            tables_to_update.add(`${vehicle.type}/${vehicle.route_ref}`);
        }
        else {
            tables_to_update.add(`${vehicle.type}/outOfService`);
        }
        changed_route = true;
    }
    else {
        const same_timestamp = cache_entry.geo.curr.timestamp === vehicle.geo.curr.timestamp;
        const same_coords = cache_entry.geo.curr.coords[0] === vehicle.geo.curr.coords[0] && cache_entry.geo.curr.coords[1] === vehicle.geo.curr.coords[1];
        if(same_timestamp || same_coords) {
            return '';
        }
        cache_entry.geo.prev = cache_entry.geo.curr;
        cache_entry.geo.curr = vehicle.geo.curr;

        const old_bearing = cache_entry.geo.bearing;
        const new_bearing = calculate_bearing(cache_entry.geo);
        if(old_bearing !== new_bearing) {
            changed_bearing = true;
            cache_entry.geo.bearing = new_bearing;
        }

        const old_speed = cache_entry.geo.speed;
        const new_speed = calculate_speed(cache_entry.geo);
        if(old_speed !== new_speed) {
            let was_active = old_speed > MIN_ACTIVE_SPEED;
            let is_active = new_speed > MIN_ACTIVE_SPEED;
            changed_state = was_active !== is_active;
            cache_entry.geo.speed = new_speed;
            if(!is_active) {
                cache_entry.geo.bearing = 0;
            }
        }

        cache_entry.reduce_marker = vehicle.reduce_marker;

        if(vehicle.route_ref != cache_entry.route_ref) {
            tables_to_update.add(`${cache_entry.type}/${cache_entry.route_ref}`);
            tables_to_update.add(`${vehicle.type}/${vehicle.route_ref}`);
            cache_entry.route_ref = vehicle.route_ref;
            cache_entry.cgm_route_id = vehicle.cgm_route_id;
            changed_route = true;
        }
    }
    if(changed_state) {
        changed_bearing = true;
    }
}
