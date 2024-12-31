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

function add_to_cache(vehicle, timestamp) {
    function is_fake_trolley(type, inv_number) {
        const inv_ranges = [[5001, 5015], [5031, 5064], [2501, 2505]];
        let is_inv_in_range = inv_ranges.some(([lower_bound, upper_bound]) => lower_bound <= inv_number && inv_number <= upper_bound);
        return type == 'trolley' && is_inv_in_range;
    }
	//normalise tags

    let inv_number = Number(vehicle.vehicleId.replace(/[a-z]/gi, ''));
    const coords = [vehicle.latitude, vehicle.longitude];
    let type = vehicle.vehicleType;
    cgm_types = {
        'bus': 'A',
        'trolley': 'TB',
        'tram': 'TM'
    };
    const cgm_id = `${cgm_types[type]}${vehicle.line}`;
    const route_ref = routes.find(route => route.cgm_id === cgm_id)?.route_ref;
    if(is_fake_trolley(type, inv_number)) {
        type = 'bus';
        // Avoid conflicts between Tramkar ebuses and Malashevtsi buses
        if(2501 <= inv_number && inv_number <= 2505) {
            inv_number *= 10;
        }
    }

    let cache_entry = cache.find(entry => entry.type === type && entry.inv_number === inv_number);
    
    let to_return = '';
    if(!cache_entry) {
        cache_entry = {
            inv_number,
            type,
            route_ref,
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

        cache_entry.geo.bearing = calculate_bearing(cache_entry.geo);
        cache_entry.geo.speed = calculate_speed(cache_entry.geo);
        
        if(cache_entry.route_ref == '94' && cache_entry.inv_number == 2032) {
            console.log(cache_entry.geo.speed);
        }

        if(route_ref != cache_entry.route_ref) {
            to_return = `${type}/${cache_entry.route_ref};`;
            cache_entry.route_ref = route_ref;
            to_return += `${type}/${route_ref}`;
        }
    }
    update_map_vehicle(cache_entry);
    return to_return;
}