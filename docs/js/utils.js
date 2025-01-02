function normalise_number(number) {
    return Number(number.replace(/[a-z]/gi, ''));
}

function determine_vehicle_location(vehicle, depots) {
	// for(const depot of depots) {
	// 	let vehicle_depot = is_vehicle_in_depot(vehicle, depot);
	// 	if(vehicle_depot) {
	// 		return {name: depot.tags.name, type: depot.tags.depot};
	// 	}
	// }
	return false;
}

function calculate_bearing(geo) {
    let [coords1, coords2] = [geo.prev.coords, geo.curr.coords];
    if(!coords1 || !coords2 || coords1.length != 2 || coords2.length != 2) {
        return null;
    }

    [lat1, lon1] = coords1;
    [lat2, lon2] = coords2;

	lat1 = toRadians(lat1);
	lon1 = toRadians(lon1);
	lat2 = toRadians(lat2);
	lon2 = toRadians(lon2);

	if(lat1 == lat2 && lon1 == lon2) {
		return null;
	}

	let y = Math.sin(lon2 - lon1) * Math.cos(lat2);
	let x = Math.cos(lat1) * Math.sin(lat2) -
			Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
	let brng = Math.atan2(y, x);
	brng = toDegrees(brng);
	return Math.round(brng)-180;
}

function calculate_speed(geo) {
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

function caclulate_distance([lat1, lon1], [lat2, lon2]) {
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