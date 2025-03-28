const WEBSOCKET_URL = 'wss://damp-unit-e9e4.bulgariadb.workers.dev/';
const DEBUG_MODE = false;
const MIN_ACTIVE_SPEED = 5;
var websocket_connection = null;
cache = [];

function get_icon({type, route_ref, geo: { speed }}) {
    const state = speed > MIN_ACTIVE_SPEED ? 'active' : 'passive';

    const width = 35; // initial 25px
    const half_width = width/2;
    const height = 57.4; // initial 41px
    const inner_circle_radius = 13; // initial 4.75px

    const icon_anchor = [width/2, width/2];

    const passive_popup_anchor = [0, -width/2];
    const active_popup_anchor = [0, -width/2];

    const triangle_acute_point = `${half_width},${height}`;
    const triangle_side_margin = 1.75;
    const triangle_left_point = `${triangle_side_margin},18.75`;
    const triangle_right_point = `${width-triangle_side_margin},18.75`;

    let class_name = 'small';
    if(route_ref != null) {
        const route_ref_length = route_ref.toString().length;
        if(route_ref_length <= 2) {
            class_name = 'large';
        }
    }


    const open_svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    const outer_circle = `<circle cx="${half_width}" cy="${half_width}" r="${half_width}"/>`;
    const inner_circle = `<circle cx="${half_width}" cy="${half_width}" r="${inner_circle_radius}" fill="#fff"/>`;
    const triangle = `<polygon points="${triangle_left_point} ${triangle_right_point} ${triangle_acute_point}"/>`;
  
    const text = `<text x="${half_width}px" y="${half_width}px" dominant-baseline="middle" text-anchor="middle" class="svg_text svg_${class_name}" transform="rotate(0)" transform-origin="${half_width} ${half_width}">${route_ref?route_ref:''}</text>`;
    const close_svg = '</svg>';

    let icon_data = {
        passive: {
            iconSize: [width, width],
            iconAnchor: icon_anchor,
            popupAnchor: passive_popup_anchor,
            html: `${open_svg}${outer_circle}${inner_circle}${text}${close_svg}`
        },
        active: {
            iconSize: [width, height],
            //iconAnchor: [12.5, 41],
            iconAnchor: icon_anchor,
            popupAnchor: active_popup_anchor,
            rotationOrigin: icon_anchor.map(a => a+' px').join(' '),
            html: `${open_svg}${outer_circle}${triangle}${inner_circle}${text}${close_svg}`,
        }
    }
    let options = {
        iconSize: icon_data[state].iconSize,
        iconAnchor: icon_data[state].iconAnchor,
        popupAnchor: icon_data[state].popupAnchor,
        html: icon_data[state].html,
        className: `vehicle-${type}`
    }
    if(state == 'active') {
        options.rotationOrigin = icon_data[state].rotationOrigin;
    }
    let icon = L.divIcon(options);
    return icon;
}

function register_vehicle_view(type, inv_number, is_marker=false) {
    console.log(`view_vehicle: ${type} ${inv_number}`);
    gtag('event', 'view_vehicle', {
        'event_category': 'vehicle',
        'event_label': `${type} ${inv_number}`,
        'value': is_marker
    });
}

function init_map() {
    map = L.map('map', {
        center: [42.69671, 23.32129],
        zoom: 13
    });
    map.invalidateSize();
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);

    
}
var routes;
function init_routes_tables() {
    return fetch('https://dimitar5555.github.io/sofiatraffic-schedules/data/routes.json')
    .then(data => data.json())
    .then(r => {
        routes = r.filter(route => route.type != 'metro');
        let table = document.querySelector('table#vehicles_table');
        for(const route of routes) {
            if(route.type == 'metro') {
                continue;
            }
            let tbody = generate_route_table(route.type, route.route_ref);
            table.appendChild(tbody);
        }
        for(const type of ['bus', 'trolley', 'tram']) {
            const vehicle_tbodies = Array.from(table.querySelectorAll(`tbody[data-type="${type}"]`));
            let tbody = generate_route_table(type, 'outOfService');
            table.insertBefore(tbody, vehicle_tbodies[vehicle_tbodies.length-1].nextSibling);
        }
        //skip metro
        //fill table
        //section per line
        //also include models?
        //typical models?
        //filter/search on top by line line_ref() or by type(select) or by inv_number and type
    });
}

function init_selectors() {
    const types = {tram: 'ТМ', trolley: 'ТБ', bus: 'А'};
    let depots_sel = document.querySelector('#vehicle_depot');
    {
        let option = document.createElement('option');
        option.innerText = 'Всички гаражи';
        option.value = 0;
        depots_sel.appendChild(option);
    }
    depots_data.forEach(depot => {
        let option = document.createElement('option');
        let prefix = typeof depot.type == 'string' ? types[depot.type] : depot.type.map(type => types[type]).join('/');
        option.innerText = `[${prefix}] ${depot.name}`;
        option.dataset.depot_id = depot.id;
        option.dataset.type = depot.type;
        depots_sel.appendChild(option);
    });

    let type_sel = document.querySelector('#vehicle_type');
    {
        let option = document.createElement('option');
        option.innerText = 'Всички видове';
        option.value = 0;
        type_sel.appendChild(option);
    }
    for(let type of Object.keys(types)) {
        let option = document.createElement('option');
        option.innerText = types[type];
        option.value = type;
        type_sel.appendChild(option);
    }
}

function init_depots() {
    depots_data.forEach(depot => {
        if(!depot.hide && depot.geometry) {
            if(depot.geometry) {
                depot.polygon = turf.polygon(depot.geometry);
                for(const geometry of depot.geometry) {
                    L.polygon(geometry).addTo(map);
                }
            }
        }
    });
}

window.onload = async () => {
    await init_routes_tables();
    init_map();
    init_depots();
    init_websocket();
    init_selectors();

    setTimeout(() => {
        document.querySelector('#remove_after_20s').remove();
    }, 20 * 1000);
};

function update_map_vehicle(new_vehicle, changed_state, changed_bearing, changed_route) {
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
    function generate_tooltip_text({ inv_number, type, route_ref }) {
        return `${bg_types[type]} ${proper_inv_number(inv_number)}`;
    }
    let has_marker = new_vehicle.marker != null;
    let vehicle_marker = false;
    let vehicle_icon = get_icon(new_vehicle);
    let new_lat_lon = new L.LatLng(...new_vehicle.geo.curr.coords);
    if(has_marker) {
        vehicle_marker = new_vehicle.marker;
    }
    else {
        const popup_options = {
            className : 'fs-6',
            closeButton: false,
            maxWidth: 350
        }

        const tooltip_options = {
            direction: 'top',
            permanent: false,
            className: 'fs-6',
            offset: [0, -12]
        }

        const marker_options = {
            icon: vehicle_icon,
        }
        vehicle_marker = L.marker(new_lat_lon, marker_options)
        .addTo(map)
        .on('click', (e) => {
            if(e.target.getPopup()) {
                e.target.unbindPopup();
                return;
            }
            const vehicle = cache.find(v => v.marker == e.target);
            const popup_text = generate_popup_text(vehicle);
            e.target.bindPopup(popup_text, popup_options).openPopup();
            register_vehicle_view(new_vehicle.type, new_vehicle.inv_number, true);
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
        new_vehicle.marker = vehicle_marker;
    }
    
    if((changed_state || changed_route) && has_marker) {
        vehicle_marker.setIcon(vehicle_icon)
    }
    if(changed_bearing && has_marker) {
        let marker_bearing = new_vehicle.geo.bearing; // -180 because the icon is pointing down
        let text_bearing = -new_vehicle.geo.bearing;
        // if(new_vehicle.geo.speed>MIN_ACTIVE_SPEED) {
        //     bearing = new_vehicle.geo.bearing-180;
        // }
        vehicle_marker.setRotationAngle(marker_bearing);
        vehicle_marker.getElement().querySelector('text').setAttribute('transform', `rotate(${text_bearing})`);
    }
    if(has_marker) {
        vehicle_marker.setLatLng(new_lat_lon);
    }
    //vehicle_marker.setRotationOrigin('bottom center')
}

const bg_types = {
    'tram': 'Трамвай',
    'trolley': 'Тролей',
    'bus': 'Автобус'
};

function get_route_classes(type) {
    return [`${type}-bg-color`, 'text-light', 'px-2'];
}

function set_route_classes(el, type, route_ref) {
    el.classList.add(...get_route_classes(type), 'text-center');
    el.innerText = `${bg_types[type]} ${route_ref}`;
}

function generate_route_table(type, route_ref) {
    let tbody = document.createElement('tbody');
    tbody.setAttribute('id', `${type}_${route_ref}`);
    tbody.setAttribute('data-type', type);
    {
        let tr = document.createElement('tr');
        let th = document.createElement('th');
        set_route_classes(th, type, route_ref);
        th.colSpan = 2;
        tr.appendChild(th);
        tbody.appendChild(tr);
    }
    return tbody;
}

function populate_route_table(relevant_vehicles, tbody, type) {
    relevant_vehicles.sort((a, b) => proper_inv_number_for_sorting(a.inv_number)-proper_inv_number_for_sorting(b.inv_number));
    for(const vehicle of relevant_vehicles) {
        let tr = document.createElement('tr');
        let vehicle_inv_number = typeof vehicle.inv_number == 'string' ? vehicle.inv_number.split('+')[0] : vehicle.inv_number;
        const depot = get_vehicle_depot(vehicle_inv_number, vehicle.type);
        tr.setAttribute('data-depot-id', depot.id);
        tr.setAttribute('data-inv-number', vehicle.inv_number);
        // tr.setAttribute('data-type', type);
        {
            let td = document.createElement('td');
            td.classList.add('text-center', 'align-middle', 'lh-100')
            td.innerText = proper_inv_number(vehicle.inv_number);
            tr.appendChild(td);
        }
        {
            let td = document.createElement('td');
            td.classList.add('text-center', 'align-middle')
            td.innerHTML = `<button class="btn btn-outline-success" onclick="zoom_to_vehicle('${vehicle.type}', '${vehicle.inv_number}')" title="Покажи на картата"><i class="bi bi-crosshair"></i></button>`;
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

function zoom_to_vehicle(type, inv_number) {
    let marker = cache.find(v => v.type == type && v.inv_number == inv_number).marker;
    map.flyTo(marker._latlng, 17, { animate: false });
    marker.fireEvent('click');
    register_vehicle_view(type, inv_number);
}

function update_route_table(type, route_ref) {
    if(route_ref === 'null' || route_ref === 'undefined') {
        route_ref = 'outOfService';
    }
    let old_tbody = document.querySelector(`#${type}_${route_ref}`);
    try {
        let relevant_vehicles;
        if(route_ref != 'outOfService') {
            const cgm_route_id = routes.find(route => route.type == type && route.route_ref == route_ref).cgm_id;
            relevant_vehicles = cache.filter(vehicle => vehicle.cgm_route_id == cgm_route_id && vehicle.route_ref);
        }
        else {
            relevant_vehicles = cache.filter(vehicle => vehicle.type == type && !vehicle.route_ref);
        }
        let new_tbody = old_tbody.cloneNode();
        new_tbody.appendChild(old_tbody.children[0]);
        populate_route_table(relevant_vehicles, new_tbody, type)
        old_tbody.replaceWith(new_tbody);
    }
    catch {
        console.log(`#${type}_${route_ref}`);
    }
}

function proper_inv_number(inv_number) {
    if(typeof inv_number == 'number' && inv_number > 9000) {
        return inv_number/10;
    }
    return inv_number;
}

function proper_inv_number_for_sorting(inv_number) {
    if(typeof inv_number == 'string') {
        return Number(inv_number.split('+')[0]);
    }
    return proper_inv_number(inv_number);
}