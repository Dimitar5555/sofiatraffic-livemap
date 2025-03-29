function generate_popup_text({ inv_number, type, route_ref, geo: { speed } }) {
    const correct_inv_number = proper_inv_number(inv_number);
    const classes = get_route_classes(type).join(' ');
    let text;
    if(!route_ref) {
        text = 'Няма маршрут';
    }
    else {
        text = `${bg_types[type]} ${route_ref}`;
    }
    const model = get_vehicle_model(inv_number, type);
    const model_text = `${model?.name} ${model?.fuel?model.fuel:''} ${model?.length?'('+model.length+' m)':''}`;
    const to_return = '<div class="text-center">'
    + `${correct_inv_number} на <span class="${classes}">${text}</span><br>`
    + `${model_text}<br>`
    + `<i class="bi bi-speedometer"></i> ${speed?speed+' km/h':'Изчислява се...'}`
    + '</div>';

    return to_return;
}

function generate_tooltip_text({ inv_number, type }) {
    return `${bg_types[type]} ${proper_inv_number(inv_number)}`;
}

function create_icon({type, geo:{speed}, route_ref, reduce_marker}) {
    const state = speed > MIN_ACTIVE_SPEED ? 'active' : 'passive';

    const width = !reduce_marker?40:40/3; // initial 25px
    const half_width = width/2;
    const height = !reduce_marker?60:20; // initial 41px

    const triangle_acute_point = `${half_width},${height}`;
    const triangle_side_margin = 1.75;
    const triangle_left_point = `${triangle_side_margin},15`;
    const triangle_right_point = `${width-triangle_side_margin},15`;

    const class_name = route_ref != null && route_ref.toString().length <= 2 ? 'large' : 'small';

    const open_svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    const outer_circle = `<circle cx="${half_width}" cy="${half_width}" r="${half_width}"/>`;
    const triangle = `<polygon points="${triangle_left_point} ${triangle_right_point} ${triangle_acute_point}"/>`;
  
    const text = `<text x="${half_width}px" y="${half_width}px" dominant-baseline="middle" text-anchor="middle" class="svg_text svg_${class_name}" transform="rotate(0)" transform-origin="${half_width} ${half_width}">${route_ref?route_ref:''}</text>`;
    const close_svg = '</svg>';
    

    let options = {
        iconSize: [width, height],
        iconAnchor: [width/2, width/2],
        popupAnchor: [0, -width/2],
        className: `vehicle-${type}`
    }
    if(state == 'active') {
        options.html = `${open_svg}${outer_circle}${triangle}${text}${close_svg}`;
        options.rotationOrigin = options.iconAnchor.map(a => a+' px').join(' ');
    }
    else {
        options.html = `${open_svg}${outer_circle}${text}${close_svg}`;
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

function update_map_markers() {
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
                const popup_text = generate_popup_text(vehicle);
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
                    const popup_text = generate_popup_text(vehicle);
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