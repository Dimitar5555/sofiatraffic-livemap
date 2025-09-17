import { determine_route_colour } from 'sofiatraffic-library';
import { BG_TYPES, MIN_ACTIVE_SPEED } from './config';
import { proper_inv_number, get_route_classes, register_vehicle_view } from './utils';
import { get_vehicle_model } from '/data/models';

function generate_vehicle_popup_text({ inv_number, type, route_ref, geo: { speed } }) {
    const correct_inv_number = proper_inv_number(inv_number);
    const classes = get_route_classes(type, route_ref).join(' ');
    let text;
    if(!route_ref) {
        text = 'Няма маршрут';
    }
    else {
        text = `${BG_TYPES[type]} ${route_ref}`;
    }
    const model = get_vehicle_model(type, inv_number);
    const model_text = `${model?.name} ${model?.fuel?model.fuel:''} ${model?.length?'('+model.length+' m)':''}`;
    const to_return = '<div class="text-center">'
    + `${correct_inv_number} на <span class="${classes}">${text}</span><br>`
    + `${model_text}<br>`
    + `<i class="bi bi-speedometer"></i> ${speed >= 0 ? speed+' km/h' : 'Изчислява се...'}`
    + '</div>';

    return to_return;
}

function generate_tooltip_text({ inv_number, type }) {
    return `${BG_TYPES[type]} ${proper_inv_number(inv_number)}`;
}

function create_icon({ type, geo: { speed, bearing }, route_ref, reduce_marker }) {
    const state = speed > MIN_ACTIVE_SPEED ? 'active' : 'passive';
    const bearing = vehicle.geo.bearing;
    
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
        className: `vehicle-${route_type}`
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
    const coords = vehicle.geo.curr.coords;
    const icon = create_icon(vehicle);
    const marker = L.marker(coords, {
        icon: icon,
        rotationAngle: vehicle.geo.bearing,
        riseOnHover: true
    });

    return marker;
}

export function update_map_markers(cache, map) {
    for(const vehicle of cache) {
        if(vehicle.hidden && vehicle.marker) {
            vehicle.marker.remove();
            vehicle.marker = null;
            continue;
        }

        if(vehicle.hidden && !vehicle.marker) {
            continue;
        }

        if(!vehicle.marker) {
            const popup_options = {
                className : 'fs-6',
                closeButton: false,
                maxWidth: 350
            }

            const tooltip_options = {
                direction: 'top',
                permanent: false,
                className: 'fs-6',
                offset: vehicle.reduce_marker?[0, 0]:[0, -12]
            }

            vehicle.marker = create_marker(vehicle);
            vehicle.marker.addTo(map)
            .on('click', (e) => {
                if(e.target.getPopup()) {
                    e.target.unbindPopup();
                    return;
                }
                const vehicle = cache.find(v => v.marker == e.target);
                const popup_text = generate_vehicle_popup_text(vehicle);
                e.target.bindPopup(popup_text, popup_options).openPopup();
                register_vehicle_view(vehicle.type, vehicle.inv_number, true);
            })
            .on('popupopen', (e) => {
                if(e.target.getTooltip()) {
                    e.target.unbindTooltip();
                }
            })
            .on('popupclose', (e) => {
                e.target.unbindPopup();
            })
            .on('mouseover', (e) => {
                if(e.target.getPopup()) {
                    return;
                }
                const vehicle = cache.find(v => v.marker == e.target);
                const tooltip_text = generate_tooltip_text(vehicle);
                e.target.bindTooltip(tooltip_text, tooltip_options).openTooltip();
            })
            .on('mouseout', (e) => {
                if(!e.target.getPopup()) {
                    return;
                }
                e.target.unbindTooltip();
            })
            .on('move', (e) => {
                const popup = e.target.getPopup();
                if(popup) {
                    const vehicle = cache.find(v => v.marker == e.target);
                    const popup_text = generate_vehicle_popup_text(vehicle);
                    popup.setContent(popup_text);
                }
            });
            continue;
        }

        const coords = vehicle.geo.curr.coords;
        vehicle.marker.setLatLng(coords);
        vehicle.marker.setRotationAngle(vehicle.geo.bearing);
        vehicle.marker.setIcon(create_icon(vehicle));
        vehicle.marker.getElement().querySelector('text').setAttribute('transform', `rotate(${vehicle.geo.bearing*-1})`);
    }
}
