import { polygon } from 'turf';
import 'leaflet';
import 'leaflet-rotatedmarker';
import { LocateControl } from 'leaflet.locatecontrol';

import { depots_data, get_vehicle_depot } from '/data/depots';
import { get_vehicle_model } from '/data/models';

import { preprocess_vehicle, handle_tram_compositions, add_to_cache } from './cache';
import { update_map_markers } from './map';
import { WEBSOCKET_URL } from './config';
import { set_route_classes, proper_inv_number, proper_inv_number_for_sorting, register_vehicle_view } from './utils';
import { is_vehicle_expected_on_line } from '/data/expected_models';

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
        zoom: 15,
        zoomControl: false
        
    });
    map.invalidateSize();
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);

    L.Control.OpenLeftPanel = L.Control.extend({
        onAdd: function() {
            const div = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control');
            
            const a = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single');
            
            const span = L.DomUtil.create('i', 'fw-bolder fs-3');
            span.innerText = '>';
            
            a.appendChild(span);
            div.appendChild(a);

            div.onclick = function() {
                const left_panel = document.querySelector('#left_panel');
                if(left_panel.classList.contains('d-none')) {
                    left_panel.classList.remove('d-none');
                }
            }
            
            return div;
        }
    });
    L.control.openLeftPanel = function(opts) {
        return new L.Control.OpenLeftPanel(opts);
    };
    L.control.openLeftPanel({ position: 'topleft' }).addTo(map);
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    new LocateControl({position: 'topright'}).addTo(map);
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

function populate_route_table(relevant_vehicles, tbody) {
    relevant_vehicles.sort((a, b) => proper_inv_number_for_sorting(a.inv_number)-proper_inv_number_for_sorting(b.inv_number));
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    for(const vehicle of relevant_vehicles) {
        const btn = document.createElement('button');
        btn.classList.add('vehicle-btn', 'btn', 'btn-outline-dark', 'btn-sm');
        btn.addEventListener('click', (e) => {
            zoom_to_vehicle(vehicle.type, vehicle.inv_number);
        });
        const vehicle_inv_number = typeof vehicle.inv_number == 'string' ? vehicle.inv_number.split('+')[0] : vehicle.inv_number;
        const depot = get_vehicle_depot(vehicle.type, vehicle_inv_number);
        btn.setAttribute('data-depot-id', depot.id);
        btn.setAttribute('data-inv-number', vehicle.inv_number);
        if(vehicle.is_unexpected) {
            btn.classList.add('btn-warning');
            btn.classList.remove('btn-outline-dark');
            btn.setAttribute('data-is-unexpected', 'true');
            tbody.setAttribute('data-unexpected', 'true');
        }
        const model = get_vehicle_model(vehicle.type, vehicle_inv_number);
        if(model.double_decker) {
            btn.dataset.doubleDecker = 'true';
            tbody.setAttribute('data-double-decker', 'true');
        }
        btn.classList.add('text-center', 'align-middle')
        btn.innerText = proper_inv_number(vehicle.inv_number);
        td.appendChild(btn);
    }
    tr.appendChild(td);
    tbody.appendChild(tr);
}

function is_screen_width_lg_or_less() {
    return window.innerWidth <= 992;
}

function zoom_to_vehicle(type, inv_number) {
    const marker = cache.find(v => v.type == type && v.inv_number == inv_number).marker;
    const left_panel = document.querySelector('#left_panel');
    if(is_screen_width_lg_or_less()){
        left_panel.classList.add('d-none');
    }
    map.flyTo(marker.getLatLng(), 17, { animate: false });
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
            relevant_vehicles = cache.filter(vehicle => vehicle.cgm_route_id == cgm_route_id && vehicle.route_ref && !vehicle.hidden);
        }
        else {
            relevant_vehicles = cache.filter(vehicle => vehicle.type == type && !vehicle.route_ref && !vehicle.hidden);
        }
        for(const v of relevant_vehicles) {
            v.is_unexpected = !is_vehicle_expected_on_line(type, route_ref, v.inv_number);
        }
        const new_tbody = old_tbody.cloneNode();
        new_tbody.appendChild(old_tbody.children[0]);
        populate_route_table(relevant_vehicles, new_tbody)
        old_tbody.replaceWith(new_tbody);
    }
    catch (err){
        console.error(err)
        console.log(old_tbody, route_ref,`#${type}_${route_ref}`);
    }
}
