const WEBSOCKET_URL = 'wss://damp-unit-e9e4.bulgariadb.workers.dev/';
const DEBUG_MODE = false;
const MIN_ACTIVE_SPEED = 5;
var websocket_connection = null;
cache = [];

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
            const processed = preprocess_vehicle(vehicle, now);
            if(!processed) {
                continue;
            }
            add_to_cache(processed, tables_to_update);
        }
        handle_tram_compositions();
        update_map_markers();
        console.timeEnd('update cache');
        for(const table of tables_to_update) {
            if(table == '') {
                continue;
            }
            const [type, line] = table.split('/');
            update_route_table(type, line);
        }
        apply_filters();
    };
    websocket_connection.onerror = () => {
        setTimeout(() => init_websocket(attempts + 1), 1000);
    }
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
        for(const type of ['bus', 'trolley', 'tram']) {
            const last_index = routes.findLastIndex(route => route.type == type);
            routes.splice(last_index+1, 0, {type: type, route_ref: 'outOfService'});
        }
        const table = document.querySelector('table#vehicles_table');
        for(const route of routes) {
            const tbody = generate_route_table(route.type, route.route_ref);
            table.appendChild(tbody);
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
};

const bg_types = {
    'tram': 'Трамвай',
    'trolley': 'Тролей',
    'bus': 'Автобус'
};

function get_route_classes(type) {
    return [`${type}-bg-color`, 'text-white', 'px-2'];
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

function is_screen_width_lg_or_less() {
    return window.innerWidth <= 992;
}

function zoom_to_vehicle(type, inv_number) {
    let marker = cache.find(v => v.type == type && v.inv_number == inv_number).marker;
    map.flyTo(marker._latlng, 17, { animate: false });
    marker.fireEvent('click');
    if(is_screen_width_lg_or_less()) {
        document.querySelector('#map').scrollIntoView({behavior: 'smooth'});
    }
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
            relevant_vehicles = cache.filter(vehicle => vehicle.cgm_route_id == cgm_route_id && vehicle.route_ref && !vehicle.hidden);
        }
        else {
            relevant_vehicles = cache.filter(vehicle => vehicle.type == type && !vehicle.route_ref && !vehicle.hidden);
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
    if(typeof inv_number === 'string') {
        return Number(inv_number.split('+')[0]);
    }
    return proper_inv_number(inv_number);
}