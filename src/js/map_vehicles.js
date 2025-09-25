import { determine_route_colour } from 'sofiatraffic-library';
import { BG_TYPES_HTML, MIN_ACTIVE_SPEED } from './config';
import { proper_inv_number, get_route_classes, register_vehicle_view } from './utils';
import { get_vehicle_model } from '/data/models';
import { stops } from './map_stops';
import { cache } from './app';
import { determine_time_ago } from './map';

function generate_vehicle_popup_text({ inv_number, type, route_ref, speed, next_stop, destination_stop, car, occupancy, timestamp, scheduled_time }, cache) {
    const correct_inv_number = proper_inv_number(inv_number);
    const classes = get_route_classes(type, route_ref).join(' ');
    let text;
    if(!route_ref) {
        text = 'Няма маршрут';
    }
    else {
        text = `${BG_TYPES_HTML[route_ref.startsWith('N') ? 'night' : type]} ${route_ref}`;
    }
    const next_stop_name = next_stop ? stops.get(next_stop)?.names.bg : null;
    const destination_stop_name = destination_stop ? stops.get(destination_stop)?.names.bg : null;
    const model = get_vehicle_model(type, inv_number);
    const model_text = `${model?.name} ${model?.fuel?model.fuel:''} ${model?.length?'('+model.length+' m)':''}`;
    const all_cars_on_line = cache.filter(v => v.type == type && v.route_ref == route_ref).sort((a, b) => a.car - b.car);
    const total_cars = all_cars_on_line.at(-1).car;
    const btn_classes = 'btn btn-sm btn-outline-dark mx-1';
    const prev_inv_number = car != 1 && all_cars_on_line[0].car != car ? all_cars_on_line.findLast(v => v.car < car && v.marker)?.inv_number : null;
    const prev_btn = `<button class="${btn_classes}" onclick="zoom_to_vehicle('${type}', ${typeof prev_inv_number !== 'string' ? prev_inv_number : '\'' + prev_inv_number + '\''})" ${prev_inv_number ? '' : 'disabled'}><i class="bi bi-arrow-left"></i></button>`;
    const next_inv_number = car != total_cars ? all_cars_on_line.find(v => v.car > car && v.marker)?.inv_number : null;
    const next_btn = `<button class="${btn_classes}" onclick="zoom_to_vehicle('${type}', ${typeof next_inv_number !== 'string' ? next_inv_number : '\'' + next_inv_number + '\''})" ${next_inv_number ? '' : 'disabled'}><i class="bi bi-arrow-right"></i></button>`;
    const occupance_mappings = {
        'EMPTY': 'Свободен',
        'MANY_SEATS_AVAILABLE': 'Много места',
        'FEW_SEATS_AVAILABLE': 'Малко места',
        'STANDING_ROOM_ONLY': 'Само правостоящи',
        'CRUSHED_STANDING_ROOM_ONLY': 'Претъпкан',
        'FULL': 'Пълен',
        'NOT_ACCEPTING_PASSENGERS': 'Не приема пътници',
        'NO_DATA_AVAILABLE': 'Няма данни',
        'NOT_BOARDABLE': 'Не превозва пътници'
    };
    const now_hh_mm = (new Date()).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }).split(':').map(Number);
    const scheduled_time_hh_mm = typeof scheduled_time == 'number' ? [(Math.floor(scheduled_time / 60)) % 24, scheduled_time % 60] : null;
    const now_mins = (now_hh_mm[0] * 60 + now_hh_mm[1]) % (24 * 60);
    const scheduled_mins = scheduled_time_hh_mm ? (scheduled_time_hh_mm[0] * 60 + scheduled_time_hh_mm[1]) % (24 * 60) : null;
    const delay = scheduled_mins ? (now_mins - scheduled_mins) % (24 * 60) : null;
    const delay_text = `<span class="${-1 <= delay && delay <= 3 ? 'text-success' : 'text-danger fw-bold'}">${delay > 0 ? '+' : ''}${delay} мин.</span>`;
    const occupance = occupancy && occupancy in occupance_mappings ? occupance_mappings[occupancy] : occupancy;
    const to_return = '<div class="">'
    + `<p class="text-center my-0">${car ? prev_btn : ''} ${correct_inv_number} на <span class="${classes}">${text}</span>${car ? ' / ' + car + ' ' + next_btn : ''}</p>`
    + `${model_text}<br>`
    // + (next_stop?`<i class="bi bi-geo-alt"></i> ${next_stop_name}<br>`:'')
    + (destination_stop ? `<i class="bi bi-flag-fill"></i> ${destination_stop_name}<br>` : '')
    + `<i class="bi bi-speedometer"></i> ${speed >= 0 ? speed+' km/h' : '-'}`
    + (occupance ? ` <span class="occupancy float-end">${occupance}</span><br>` : '')
    + (typeof delay == 'number' ? `<i class="bi bi-clock"></i> ` + delay_text : '')
    + `<span data-timestamp="${timestamp}" class="float-end text-muted" id="last-updated">${determine_time_ago(timestamp)}</span><br>`
    + '</div>';

    return to_return;
}

export function show_markers_in_view(map, vehicles_layer, cache) {
    const bounds = map.getBounds();
    for(const vehicle of cache) {
        const marker = vehicle.marker;
        if(!marker) {
            continue;
        }
        if(bounds.contains(vehicle.coords)) {
            marker.addTo(vehicles_layer);
        }
        else {
            vehicles_layer._map.removeLayer(marker);
        }
    }
}

function generate_tooltip_text({ inv_number, type, car, route_ref }) {
    if(route_ref === 'null') {
        route_ref = null;
    }
    const classes = get_route_classes(type, route_ref).join(' ');
    return `${proper_inv_number(inv_number)} <span class="${classes}">${BG_TYPES_HTML[route_ref && route_ref.startsWith('N') ? 'night' : type]} ${route_ref ?? 'Няма маршрут'}</span>${car ? ' / ' + car : ''}`;
}

function create_icon({type, speed, route_ref, reduce_marker, bearing, timestamp , old_coords}) {
    const state = speed > MIN_ACTIVE_SPEED && old_coords ? 'active' : 'passive';
    
    const width = !reduce_marker?29:29/3; // initial 25px
    const half_width = width/2;
    const height = !reduce_marker?45:45; // initial 41px

    const triangle_acute_point = `${half_width},${height}`;
    const triangle_side_margin = 1.75;
    const triangle_left_point = `${triangle_side_margin-0.75},20`;
    const triangle_right_point = `${width-triangle_side_margin+0.75},20`;

    const class_name = route_ref != null && route_ref.toString().length <= 2 ? 'large' : 'small';

    const open_svg = `<svg width="${width+1}" height="${height+1}" viewBox="-0.5 -0.5 ${width+0.5} ${height+0.5}" xmlns="http://www.w3.org/2000/svg">`;
    const circle = `<circle stroke="black" stroke-width="0.95px" cx="${half_width}" cy="${half_width}" r="${half_width}"/>`;
    const triangle = `<polygon points="${triangle_left_point} ${triangle_right_point} ${triangle_acute_point}"/>`;
    const triangle_outline = `<g stroke="black" stroke-width="0.95px"><line x1="${triangle_left_point.split(',')[0]}" y1="${triangle_left_point.split(',')[1]}" x2="${triangle_acute_point.split(',')[0]}" y2="${triangle_acute_point.split(',')[1]}"/><line x1="${triangle_right_point.split(',')[0]}" y1="${triangle_right_point.split(',')[1]}" x2="${triangle_acute_point.split(',')[0]}" y2="${triangle_acute_point.split(',')[1]}"/></g>`;

    const text = `<text x="${half_width}px" y="${half_width}px" dominant-baseline="middle" text-anchor="middle" class="svg_text svg_${class_name}" transform-origin="${half_width} ${half_width}" transform="rotate(${state=='active' ? -bearing + 360 : 0})">${route_ref ?? ''}</text>`;
    const close_svg = '</svg>';
    
    const route_type = typeof route_ref === 'string' && route_ref.startsWith('N') ? 'night' : type;
    const options = {
        iconSize: [width, height],
        iconAnchor: [width/2, width/2],
        popupAnchor: [0, -width/2],
        tooltipAnchor: [0, -width/2 - 9],
        className: `vehicle-${route_type} ${Date.now() / 1000 - timestamp > 60 ? 'vehicle-inactive' : ''}`,
    }
    if(state == 'active') {
        options.html = `${open_svg}${circle}${triangle}${triangle_outline}${text}${close_svg}`;
        options.rotationOrigin = options.iconAnchor.map(a => a+' px').join(' ');
    }
    else {
        options.html = `${open_svg}${circle}${text}${close_svg}`;
    }
    const icon = L.divIcon(options);
    return icon;
}

function create_marker(vehicle) {
    const coords = vehicle.coords;
    const icon = create_icon(vehicle);
    const marker = L.marker(coords, {
        icon: icon,
        rotationAngle: vehicle.bearing,
        riseOnHover: true,
        zIndexOffset: 1000
    });

    return marker;
}

function bind_popup_and_tooltip(e, vehicle, cache) {
    if(e.target.getPopup()) {
        return;
    }
    const popup_options = {
        className : 'fs-6',
        closeButton: false,
        minWidth: 250
    }

    const tooltip_options = {
        className: 'fs-6',
        direction: 'top',
        permanent: false,
        // offset: vehicle.reduce_marker?[0, 0]:[0, -12]
    }

    const popup_text = generate_vehicle_popup_text(vehicle, cache);
    e.target.bindPopup(popup_text, popup_options);

    const tooltip_text = generate_tooltip_text(vehicle);
    e.target.bindTooltip(tooltip_text, tooltip_options);


    if(e.type === 'click') {
        e.target.openPopup();
        register_vehicle_view(vehicle.type, vehicle.inv_number, true);
    }
    else if(e.type === 'mouseover') {
        e.target.openTooltip();
    }
}

export function update_map_markers(cache, map) {
    // const now = Date.now() / 1000;
    for(const vehicle of cache) {
        // const time_diff = now - vehicle.timestamp;
        // if(time_diff > 30) {
        //     if(vehicle.marker) {
        //         vehicle.marker.remove();
        //         vehicle.marker = null;
        //     }
        //     continue;
        // }
        if(vehicle.hidden && vehicle.marker) {
            vehicle.marker.remove();
            vehicle.marker = null;
            continue;
        }

        if(vehicle.hidden && !vehicle.marker) {
            continue;
        }

        if(!vehicle.marker) {
            vehicle.marker = create_marker(vehicle)
            .on('click mouseover', (e) => {
                bind_popup_and_tooltip(e, vehicle, cache);
            })
            .on('move', (e) => {
                const popup = e.target.getPopup();
                if(popup) {
                    const vehicle = cache.find(v => v.marker == e.target);
                    const popup_text = generate_vehicle_popup_text(vehicle, cache);
                    popup.setContent(popup_text);
                }
            });
            continue;
        }

        const coords = vehicle.coords;
        vehicle.marker.setLatLng(coords);
        vehicle.marker.setIcon(create_icon(vehicle));
        vehicle.marker.setRotationAngle(vehicle.speed > MIN_ACTIVE_SPEED ? vehicle.bearing : 0);
    }
}