export function calculate_bearing(geo) {
    let [coords1, coords2] = [geo.prev.coords, geo.curr.coords];
    if(!coords1 || !coords2 || coords1.length != 2 || coords2.length != 2) {
        return null;
    }

    const [lat1, lon1] = coords1;
    const [lat2, lon2] = coords2;

	if(lat1 == lat2 && lon1 == lon2) {
		return null;
	}

	/*
		Using simple trigonometry to calculate bearing
		between two points on the Earth's surface.

		Using Great-circle bearing formula is not necessary
		and too expensive for this task.

		The points are quite close to each other, so the
		approximation is acceptable and the Earth's curvature
		can be safely ignored.
	*/
	const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;
    const bearingRad = Math.atan2(deltaLon, deltaLat);
    const bearingDeg = toDegrees(bearingRad);
	return (bearingDeg + 360) % 360 - 180;
}

export function calculate_speed(geo) {
    let [start_coords, start_time, end_coords, end_time] = [geo.prev.coords, geo.prev.timestamp, geo.curr.coords, geo.curr.timestamp];
    if(!start_coords || !end_coords || start_coords.length != 2 || end_coords.length != 2) {
        return -2;
    }
    if(start_time == end_time) {
        return -3;
    }
	start_time /= 1000;
	end_time /= 1000;
	let distance = Math.round(caclulate_distance(start_coords, end_coords));
	let speed = Math.round(distance/Math.abs(end_time-start_time)*3600/1000);
	return speed;
}

function toRadians(degrees) {
	return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
	return radians * (180 / Math.PI);
}

export function caclulate_distance([lat1, lon1], [lat2, lon2]) {
    if(lat1 == lat2 && lon1 == lon2) {
        return 0;
    }

	const R = 6371e3; // Earth radius in meters
	const φ1 = toRadians(lat1);
	const φ2 = toRadians(lat2);
	const Δφ = toRadians(lat2 - lat1);
	const Δλ = toRadians(lon2 - lon1);
  
	const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			  Math.cos(φ1) * Math.cos(φ2) *
			  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
	return R * c; // in meters
}

export function proper_inv_number(inv_number) {
    if(typeof inv_number == 'number' && inv_number > 9999) {
        return inv_number/10;
    }
    return inv_number;
}

export function proper_inv_number_for_sorting(inv_number) {
    if(typeof inv_number === 'string') {
        return Number(inv_number.split('+')[0]);
    }
    return proper_inv_number(inv_number);
}

export function get_route_classes(type, route_ref) {
    const to_return = ['text-white', 'px-2'];
    if(typeof route_ref === 'string' && route_ref.startsWith('N')) {
        to_return.push('night-bg-color');
    }
    else {
        to_return.push(`${type}-bg-color`);
    }
    return to_return;
}

export function set_route_classes(el, type, route_ref) {
    el.classList.add(...get_route_classes(type, route_ref), 'text-center');
    const BG_TYPES_HTML = {
        'tram': `<i class="icon tram-icon"></i>`,
        'trolley': `<i class="icon trolley-icon"></i>`,
        'bus': `<i class="icon bus-icon"></i>`,
        'night': `<i class="icon night-icon"></i>`
    }
    el.innerHTML = `${BG_TYPES_HTML[route_ref.startsWith('N') ? 'night' : type]} ${route_ref}`;
}

export function register_vehicle_view(type, inv_number, is_marker=false) {
    console.log(`view_vehicle: ${type} ${inv_number}`);
    gtag('event', 'view_vehicle', {
        'event_category': 'vehicle',
        'event_label': `${type} ${inv_number}`,
        'value': is_marker
    });
}
