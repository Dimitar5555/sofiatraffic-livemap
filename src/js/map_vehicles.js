import { determine_route_colour } from 'sofiatraffic-library';
import { BG_TYPES_HTML, MIN_ACTIVE_SPEED, occupancy_mappings } from './config';
import { proper_inv_number, get_route_classes, register_vehicle_view } from './utils';
import { get_vehicle_model_name } from '/data/models';
import { stops } from './map_stops';
import { cache, zoom_to_vehicle } from './app';
import { determine_time_ago } from './map';
import { is_dark_theme } from './app';

function generate_vehicle_popup_text(vehicle, cache) {
    const {
        inv_number,
        type,
        route_ref,
        speed,
        destination_stop,
        car,
        occupancy,
        timestamp,
        scheduled_time
    } = vehicle;

    // --- Helpers ---
    const correctInvNumber = proper_inv_number(inv_number);
    const classes = get_route_classes(type, route_ref).join(' ');
    const destinationStopName = destination_stop ? stops.get(destination_stop)?.names.bg : null;
    const modelText = get_vehicle_model_name(vehicle);

    const allCarsOnLine = cache
        .filter(v => v.type === type && v.route_ref === route_ref)
        .sort((a, b) => a.car - b.car);
    const totalCars = allCarsOnLine.at(-1)?.car || 0;


    const parent_div = document.createElement('div');
    parent_div.classList.add('d-flex', 'flex-column');
    
    const first_row = document.createElement('p');
    first_row.classList.add('mb-1');
    parent_div.appendChild(first_row);
    {
        first_row.classList.add('text-center', 'my-0');
        first_row.appendChild(document.createTextNode(`${correctInvNumber} на `));
        const route_text = ' ' + (route_ref ?? 'Няма маршрут');
        const icon = document.createElement('i');
        icon.className = `icon ${route_ref && route_ref.startsWith('N') ? 'night' : type}-icon`;
        const route_num_span = document.createElement('span');
        route_num_span.className = classes;
        route_num_span.appendChild(icon);
        route_num_span.appendChild(document.createTextNode(route_text));
        first_row.appendChild(route_num_span);
        if(car) {
            first_row.appendChild(document.createTextNode(` / ${car}`));
            const btn_main_class = is_dark_theme() ? 'btn-outline-light' : 'btn-outline-dark';
            if(car !== 1 && allCarsOnLine[0].car !== car) {
                const prev_btn = document.createElement('button');
                prev_btn.className = `btn btn-sm ${btn_main_class} mx-1`;
                const i = document.createElement('i');
                i.className = 'bi bi-arrow-left';
                prev_btn.appendChild(i);
                const prev_cgm_id = allCarsOnLine.findLast(v => v.car < car && v.marker)?.cgm_id;
                if (prev_cgm_id) {
                    prev_btn.addEventListener('click', () => {
                        zoom_to_vehicle(prev_cgm_id);
                    });
                    first_row.insertBefore(prev_btn, first_row.firstChild);
                }
            }

            if(car !== totalCars) {
                const next_btn = document.createElement('button');
                next_btn.className = `btn btn-sm ${btn_main_class} mx-1`;
                const i = document.createElement('i');
                i.className = 'bi bi-arrow-right';
                next_btn.appendChild(i);
                const next_cgm_id = allCarsOnLine.find(v => v.car > car && v.marker)?.cgm_id;
                if (next_cgm_id) {
                    next_btn.addEventListener('click', () => {
                        zoom_to_vehicle(next_cgm_id);
                    });
                    first_row.appendChild(next_btn);
                }
            }
        }
    }

    {
        const row = document.createElement('div');
        parent_div.appendChild(row);
        if(modelText) {
            const model_span = document.createElement('span');
            model_span.innerText = modelText;
            model_span.classList.add('text-nowrap');
            row.appendChild(model_span);
        }
    }

    {
        const row = document.createElement('div');
        parent_div.appendChild(row);
        if(destination_stop) {
            const icon = document.createElement('i');
            icon.className = 'bi bi-flag-fill';
            row.appendChild(icon);
            row.appendChild(document.createTextNode(' ' + (destinationStopName || 'неизвестна')));
        }
    }

    {
        const row = document.createElement('div');
        row.classList.add('d-flex', 'justify-content-between');
        parent_div.appendChild(row);


        const speedIcon = document.createElement('i');
        speedIcon.className = 'bi bi-speedometer';
        const speed_div = document.createElement('div');

        speed_div.appendChild(speedIcon);
        speed_div.appendChild(document.createTextNode(' ' + (speed >= 0 ? speed : '-') + ' km/h'));
        row.appendChild(speed_div);

        if(occupancy) {
            const occupancy_text = occupancy_mappings[occupancy] || occupancy || '';
            const span = document.createElement('span');
            span.className = 'mt-auto text-nowrap';
            span.appendChild(document.createTextNode(occupancy_text));
            row.appendChild(span);
        }
    }
    
    {
        const row = document.createElement('div');
        row.classList.add('d-flex', 'justify-content-between');
        parent_div.appendChild(row);
        if(scheduled_time) {
            const now_hh_mm = (new Date()).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }).split(':').map(Number); 
            const scheduled_time_hh_mm = typeof scheduled_time == 'number' ? [(Math.floor(scheduled_time / 60)) % 24, scheduled_time % 60] : null;
            const now_mins = (now_hh_mm[0] * 60 + now_hh_mm[1]) % (24 * 60); 
            const scheduled_mins = scheduled_time_hh_mm ? (scheduled_time_hh_mm[0] * 60 + scheduled_time_hh_mm[1]) % (24 * 60) : null; 
            let delay = scheduled_mins ? (now_mins - scheduled_mins) % (24 * 60) : null;
            if(1000 < delay) {
                delay -= 24 * 60;
            }
            else if(delay < -1000) {
                delay += 24 * 60;
            }

            const delay_class = -1 <= delay && delay <= 3 ? 'text-success' : 'text-danger fw-bold';
            const delayText = `${delay > 0 ? '+' : ''}${delay} мин.`;

            const delay_div = document.createElement('div');
            const clockIcon = document.createElement('i');
            clockIcon.className = 'bi bi-clock';
            delay_div.appendChild(clockIcon);
            const delay_span = document.createElement('span');
            delay_span.className = delay_class
            delay_span.innerText = delayText;
            delay_div.appendChild(document.createTextNode(' '));
            delay_div.appendChild(delay_span);
            row.appendChild(delay_div);
        }
        else{
            row.appendChild(document.createElement('span'));
        }

        const span = document.createElement('span');
        span.setAttribute('data-timestamp', timestamp);
        span.classList.add('text-muted', occupancy ?? 'mt-auto');
        span.id = 'last-updated';
        span.innerText = determine_time_ago(timestamp);
        row.appendChild(span);
    }
    return parent_div;
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
        minWidth: 275
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