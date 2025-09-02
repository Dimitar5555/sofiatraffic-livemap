import { polygon } from 'turf';
import 'leaflet';
import 'leaflet-rotatedmarker';
import { LocateControl } from 'leaflet.locatecontrol';

import { preprocess_vehicle, handle_tram_compositions, add_to_cache } from './cache';
import { update_map_markers } from './map';
import { WEBSOCKET_URL } from './config';
import { set_route_classes, proper_inv_number, proper_inv_number_for_sorting, register_vehicle_view } from './utils';

var websocket_connection = null;
var cache = [];

function init_websocket(attempts=1) {
    if(websocket_connection !== null) {
        websocket_connection.close();
        websocket_connection = null;
    }
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
        const tables_to_update = new Set();
        const already_processed = new Set();
        for(const vehicle of data.avl) {
            if(already_processed.has(vehicle.vehicleId)) {
                continue;
            }
            already_processed.add(vehicle.vehicleId);
            const processed = preprocess_vehicle(vehicle, now, routes);
            if(!processed) {
                continue;
            }
            add_to_cache(processed, tables_to_update, cache);
        }
        handle_tram_compositions(cache);
        update_map_markers(cache, map);
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

var map = null;

function init_map() {
    map = L.map('map', {
        center: [42.69671, 23.32129],
        zoom: 13
    });
    map.invalidateSize();
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    new LocateControl().addTo(map);
}

var routes = [];
function init_routes_tables() {
    return fetch('https://raw.githubusercontent.com/Dimitar5555/sofiatraffic-schedules/refs/heads/master/data/routes.json')
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
                depot.polygon = polygon(depot.geometry);
                for(const geometry of depot.geometry) {
                    L.polygon(geometry).addTo(map).bindPopup(depot.name);
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
            td.innerHTML = `<button class="btn btn-outline-success" title="Покажи на картата"><i class="bi bi-crosshair"></i></button>`;
            tr.appendChild(td);
            td.childNodes[0].addEventListener('click', (e) => {
                zoom_to_vehicle(vehicle.type, vehicle.inv_number);
                e.stopPropagation();
            });
        }
        tbody.appendChild(tr);
    }
}

function is_screen_width_lg_or_less() {
    return window.innerWidth <= 992;
}

function zoom_to_vehicle(type, inv_number) {
    let marker = cache.find(v => v.type == type && v.inv_number == inv_number).marker;
    map.flyTo(marker.getLatLng(), 17, { animate: false });
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
    catch (err){
        console.error(err)
        console.log(old_tbody, route_ref,`#${type}_${route_ref}`);
    }
}
