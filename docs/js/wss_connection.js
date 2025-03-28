function preprocess_vehicle(vehicle) {
    vehicle.type = vehicle.vehicleType
    delete vehicle.vehicleType;

    const cgm_types = {
        'bus': 'A',
        'trolley': 'TB',
        'tram': 'TM'
    };
    vehicle.cgm_route_id = `${cgm_types[vehicle.type]}${vehicle.line}`;
}

function init_websocket(attempts=1) {
    if(attempts >= 2) {
        const el = document.querySelector('.container.mb-3');
        const alert = document.createElement('div');
        alert.classList.add('alert', 'alert-danger', 'text-center');
        alert.textContent = 'Услугата е временно недостъпна. Моля опитайте по-късно.';
        el.innerHTML = '';
        el.appendChild(alert);
        return;
    }
    websocket_connection = new WebSocket(WEBSOCKET_URL);
    websocket_connection.onmessage = ev => {
        let data = JSON.parse(ev.data);
        const now = Date.now();

        console.time('update cache', data.avl.length);
        let tables_to_update = new Set();
        for(const vehicle of data.avl) {
            preprocess_vehicle(vehicle);
            add_to_cache(vehicle, now, tables_to_update);
            // update_cache(processed);
        }
        console.timeEnd('update cache');
        for(const table of tables_to_update) {
            if(table == '') {
                continue;
            }
            const [type, line] = table.split('/');
            update_route_table(type, line);
        }
        // update_cache(processed_vehicles);
        apply_filters();
    };
    websocket_connection.onerror = () => {
        setTimeout(() => init_websocket(attempts + 1), 1000);
    }
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

function determine_inv_number(vehicle) {
    function is_fake_trolley(type, inv_number) {
        const inv_ranges = [[5001, 5015], [5031, 5064], [2501, 2505], [1703, 1703]];
        const is_inv_in_range = inv_ranges.some(([lower_bound, upper_bound]) => lower_bound <= inv_number && inv_number <= upper_bound);
        return type == 'trolley' && is_inv_in_range;
    }

    let inv_number = Number(vehicle.vehicleId.replace(/[a-z]/gi, ''));
    if(is_second_wagon(inv_number) && MERGE_TRAM_COMPONENTS) {
        return '';
    }

    if(is_fake_trolley(vehicle.type, inv_number)) {
        vehicle.type = 'bus';
        // Avoid conflicts between Tramkar ebuses and Malashevtsi buses
        if(2501 <= inv_number && inv_number <= 2505) {
            inv_number *= 10;
        }
    }
    
    if(vehicle.type == 'tram' && MERGE_TRAM_COMPONENTS) {
        const second_wagon = get_second_wagon_of(inv_number);
        if(second_wagon) {
            inv_number = `${inv_number}+${second_wagon}`;
        }
    }
    return inv_number;
}

function add_to_cache(vehicle, timestamp, tables_to_update) {
    const coords = [vehicle.latitude, vehicle.longitude];
    if(are_coords_invalid(coords)) {
        return;
    }

    const inv_number = determine_inv_number(vehicle);
    if(inv_number == '' || inv_number == 8888) {
        return;
    }

    const type = vehicle.type;

    let route_ref = null;
    let reduce_marker = true;
    if(!is_vehicle_in_depot(type, coords)) {
        route_ref = routes.find(route => route.cgm_id === vehicle.cgm_route_id)?.route_ref;
        reduce_marker = false;
    }

    let cache_entry = cache.find(entry => entry.type === type && entry.inv_number === inv_number);
    
    let changed_state = false;
    let changed_bearing = false;
    let changed_route = false;
    if(!cache_entry) {
        cache_entry = {
            inv_number,
            type,
            route_ref,
            cgm_route_id: vehicle.cgm_route_id,
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
            tables_to_update.add(`${type}/${route_ref}`);
        }
        else {
            tables_to_update.add(`${type}/outOfService`);
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

        if(route_ref != cache_entry.route_ref) {
            tables_to_update.add(`${type}/${cache_entry.route_ref}`);
            tables_to_update.add(`${type}/${route_ref}`);
            cache_entry.route_ref = route_ref;
            cache_entry.cgm_route_id = vehicle.cgm_route_id;
            changed_route = true;
        }
    }
    if(changed_state) {
        changed_bearing = true;
    }
    update_map_vehicle(cache_entry, changed_state, changed_bearing, changed_route, reduce_marker);
}
