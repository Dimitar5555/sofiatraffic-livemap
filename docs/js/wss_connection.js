function init_websocket() {
    websocket_connection = new WebSocket(WEBSOCKET_URL);
    websocket_connection.onmessage = ev => {
        let data = JSON.parse(ev.data);
        const now = Date.now();

        let tables_to_update = new Set();
        for(let vehicle of data.avl) {
            const response = add_to_cache(vehicle, now).split(';');
            for(const table of response) {
                tables_to_update.add(table);
            }
            // update_cache(processed);
        }
        for(let table of tables_to_update) {
            if(table == '') {
                continue;
            }
            let [type, line] = table.split('/');
            update_route_table(type, line);
        }
        // update_cache(processed_vehicles);
    };
}

function is_vehicle_in_depot(type, coords) {
    return depots_data.some(depot => 
        depot.polygon
        && (depot.type == type || depot.type.includes(type))
        && turf.booleanPointInPolygon(coords, depot.polygon)
    )
}

function is_second_wagon(inv_number) {
    return tram_compositions.some(tc => tc[1] == inv_number);
}

function get_second_wagon_of(inv_number) {
    const result = tram_compositions.find(tc => tc[0] == inv_number);
    return result?result[1]:false;
}

function add_to_cache(vehicle, timestamp) {
    if(vehicle.latitude == 0 && vehicle.longitude == 0) {
        // Ignore vehicles with invalid coordinates
        return '';
    }
    function is_fake_trolley(type, inv_number) {
        const inv_ranges = [[5001, 5015], [5031, 5064], [2501, 2505], [1703, 1703]];
        let is_inv_in_range = inv_ranges.some(([lower_bound, upper_bound]) => lower_bound <= inv_number && inv_number <= upper_bound);
        return type == 'trolley' && is_inv_in_range;
    }
	//normalise tags

    let inv_number = Number(vehicle.vehicleId.replace(/[a-z]/gi, ''));
    if(is_second_wagon(inv_number)) {
        return '';
    }
    const coords = [vehicle.latitude, vehicle.longitude];
    let type = vehicle.vehicleType;
    cgm_types = {
        'bus': 'A',
        'trolley': 'TB',
        'tram': 'TM'
    };
    const cgm_id = `${cgm_types[type]}${vehicle.line}`;
    let route_ref = routes.find(route => route.cgm_id === cgm_id)?.route_ref;
    if(is_fake_trolley(type, inv_number)) {
        type = 'bus';
        // Avoid conflicts between Tramkar ebuses and Malashevtsi buses
        if(2501 <= inv_number && inv_number <= 2505) {
            inv_number *= 10;
        }
    }
    
    if(type == 'tram') {
        const second_wagon = get_second_wagon_of(inv_number);
        if(second_wagon) {
            inv_number = `${inv_number}+${second_wagon}`;
        }
    }

    if(is_vehicle_in_depot(type, coords)) {
        route_ref = null;
    }

    let cache_entry = cache.find(entry => entry.type === type && entry.inv_number === inv_number);
    
    let to_return = '';
    let changed_state = false;
    let changed_bearing = false;
    let changed_route = false;
    let changed_speed = false;
    if(!cache_entry) {
        cache_entry = {
            inv_number,
            type,
            route_ref,
            cgm_route_id: cgm_id,
            geo: {
                bearing: null,
                speed: null,
                prev: {
                    coords: [0, 0],
                    timestamp: null
                },
                curr: {
                    coords: coords,
                    timestamp: timestamp
                }
            }
        };
        cache.push(cache_entry);
        if(route_ref) {
            to_return = `${type}/${route_ref}`;
        }
        changed_route = true;
    }
    else {
        const same_timestamp = cache_entry.geo.curr.timestamp === timestamp;
        const same_coords = cache_entry.geo.curr.coords[0] === coords[0] && cache_entry.geo.curr.coords[1] === coords[1];
        if(same_timestamp || same_coords) {
            return '';
        }
        cache_entry.geo.prev.coords[0] = cache_entry.geo.curr.coords[0];
        cache_entry.geo.prev.coords[1] = cache_entry.geo.curr.coords[1];
        cache_entry.geo.prev.timestamp = cache_entry.geo.curr.timestamp;

        cache_entry.geo.curr.coords[0] = coords[0];
        cache_entry.geo.curr.coords[1] = coords[1];
        cache_entry.geo.curr.timestamp = timestamp;

        let old_bearing = cache_entry.geo.bearing;
        let new_bearing = calculate_bearing(cache_entry.geo);
        if(old_bearing !== new_bearing) {
            changed_bearing = true;
            cache_entry.geo.bearing = new_bearing;
        }


        let old_speed = cache_entry.geo.speed;
        let new_speed = calculate_speed(cache_entry.geo);
        if(old_speed !== new_speed) {
            let was_active = old_speed > MIN_ACTIVE_SPEED;
            let is_active = new_speed > MIN_ACTIVE_SPEED;
            changed_state = was_active !== is_active;
            cache_entry.geo.speed = new_speed;
            changed_speed = true;
            if(!is_active) {
                cache_entry.geo.bearing = 0;
            }
        }

        if(route_ref != cache_entry.route_ref) {
            to_return = `${type}/${cache_entry.route_ref};`;
            cache_entry.route_ref = route_ref;
            cache_entry.cgm_route_id = cgm_id;
            to_return += `${type}/${route_ref}`;
            changed_route = true;
        }
    }
    if(changed_state) {
        changed_bearing = true;
    }
    update_map_vehicle(cache_entry, changed_state, changed_bearing, changed_route, changed_speed);
    return to_return;
}
