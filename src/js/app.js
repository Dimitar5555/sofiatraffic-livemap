import { polygon } from 'turf';
import 'leaflet';
import 'leaflet-rotatedmarker';
import { LocateControl } from 'leaflet.locatecontrol';

import { depots_data, get_vehicle_depot } from '/data/depots';
import { get_vehicle_model } from '/data/models';

import { handle_tram_compositions, add_to_cache } from './cache';
import { update_map_markers, show_markers_in_view } from './map_vehicles';
import { load_stops, show_stops_in_view } from './map_stops';
import { WEBSOCKET_URL } from './config';
import { set_route_classes, proper_inv_number, proper_inv_number_for_sorting, register_vehicle_view } from './utils';
import { is_vehicle_expected_on_line } from '/data/expected_models';

var websocket_connection = null;
export var cache = [];

function init_websocket(attempts=1) {
    if(websocket_connection !== null) {
        websocket_connection.close();
        websocket_connection = null;
    }
    if(attempts >= 2) {
        const el = document.querySelector('body');
        const alert = document.createElement('div');
        alert.classList.add('alert', 'alert-danger', 'text-center', 'm-3');
        alert.textContent = 'Услугата е временно недостъпна. Моля опитайте по-късно.';
        el.innerHTML = '';
        el.appendChild(alert);
        return;
    }
    websocket_connection = new WebSocket(WEBSOCKET_URL);
    websocket_connection.onmessage = ev => {
        let data = JSON.parse(ev.data);
        const now = Date.now();

        console.time('update cache', data.length);
        const tables_to_update = new Set();
        const already_processed = new Set();
        for(const vehicle of data) {
            if(!vehicle.route_ref && vehicle.cgm_route_id) {
                vehicle.route_ref = routes.find(r => r.cgm_id == vehicle.cgm_route_id)?.route_ref;
            }
            if(!vehicle.type && vehicle.cgm_route_id) {
                vehicle.type = routes.find(r => r.cgm_id == vehicle.cgm_route_id)?.type;
            }
            const fake_trolleys = ['60', '73', '74', '123', '288', '801'];
            if(fake_trolleys.includes(vehicle.route_ref)) {
                vehicle.type = 'bus';
            }
            add_to_cache(vehicle, tables_to_update, cache);
        }
        handle_tram_compositions(cache, get_setting('data_source'));
        hide_inactive_vehicles();
        update_map_markers(cache, map);
        show_markers_in_view(map, vehicles_layer, cache);
        console.timeEnd('update cache');
        update_route_tables(tables_to_update);
        apply_filters();
    };
    websocket_connection.onerror = () => {
        setTimeout(() => init_websocket(attempts + 1), 1000);
    }
}

export var map = null;

function init_map() {
    map = L.map('map', {
        center: [42.69671, 23.32129],
        zoom: 15,
        zoomControl: false
        
    });
    map.invalidateSize();
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);

    L.Control.OpenInfoPanel = L.Control.extend({
        onAdd: function() {
            const div = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control');
            
            const a = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single');
            
            const i = L.DomUtil.create('i', 'bi bi-info-lg fs-3');

            a.appendChild(i);
            div.appendChild(a);

            div.onclick = function() {
                const info_panel = document.querySelector('#info-panel');
                info_panel.classList.remove('d-none');
            }
            
            return div;
        }
    });
    L.control.openInfoPanel = function(opts) {
        return new L.Control.OpenInfoPanel(opts);
    }

    L.Control.OpenVehiclesPanel = L.Control.extend({
        onAdd: function() {
            const div = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control');
            
            const a = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single');
            
            const i = L.DomUtil.create('i', 'bi bi-bus-front-fill fs-4');
            
            a.appendChild(i);
            div.appendChild(a);

            div.onclick = function() {
                const vehicles_panel = document.querySelector('#vehicles-panel');
                vehicles_panel.classList.remove('d-none');
            }
            
            return div;
        }
    });

    L.Control.OpenSettingsPanel = L.Control.extend({
        onAdd: function() {
            const div = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control');
            
            const a = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single');
            
            const i = L.DomUtil.create('i', 'bi bi-gear-fill fs-4');

            a.appendChild(i);
            div.appendChild(a);

            div.onclick = function() {
                const settings_panel = document.querySelector('#settings-panel');
                settings_panel.classList.remove('d-none');
            }
            
            return div;
        }
    });
    L.control.openSettingsPanel = function(opts) {
        return new L.Control.OpenSettingsPanel(opts);
    }
    L.control.openVehiclesPanel = function(opts) {
        return new L.Control.OpenVehiclesPanel(opts);
    };
    L.control.openVehiclesPanel({ position: 'topleft' }).addTo(map);
    L.control.openInfoPanel({ position: 'topleft' }).addTo(map);
    L.control.openSettingsPanel({ position: 'topleft' }).addTo(map);
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    new LocateControl({position: 'topright'}).addTo(map);
}

export let routes = [];
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
            }
        }
    });
}

let vehicles_layer = null;
export let stops_layer = null;

window.onload = async () => {
    await init_routes_tables();
    init_map();
    init_depots();
    init_websocket();
    init_selectors();
    init_settings();
    vehicles_layer = L.layerGroup().addTo(map);
    stops_layer = L.layerGroup().addTo(map);
    load_stops(stops_layer);
    map.on('load', () => {
        console.log('Fired map load');
        show_stops_in_view(map, stops_layer);
        show_markers_in_view(map, vehicles_layer, cache);
    });
    map.on('zoomend', () => {
        show_stops_in_view(map, stops_layer);
        show_markers_in_view(map, vehicles_layer, cache);
    });
    map.on('moveend', () => {
        show_stops_in_view(map, stops_layer);
        show_markers_in_view(map, vehicles_layer, cache);
    });

    document.addEventListener('keyup', (e) => {
        if(e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
            return;
        }
        const prev_btn = document.querySelector('.bi-arrow-left')?.parentElement;
        const next_btn = document.querySelector('.bi-arrow-right')?.parentElement;
        if(e.key === 'ArrowLeft' && prev_btn && !prev_btn.hasAttribute('disabled')) {
            prev_btn.click();
        }
        else if(e.key === 'ArrowRight' && next_btn && !next_btn.hasAttribute('disabled')) {
            next_btn.click();
        }
    });
};

function generate_route_table(type, route_ref) {
    const tbody = document.createElement('tbody');
    tbody.setAttribute('id', `${type}_${route_ref}`);
    tbody.setAttribute('data-type', type);
    {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
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
    const btns = [];
    for(const vehicle of relevant_vehicles) {
        const btn = document.createElement('button');
        btn.classList.add('vehicle-btn', 'btn', 'btn-outline-dark', 'btn-sm');
        btn.addEventListener('click', (e) => {
            zoom_to_vehicle(vehicle.type, vehicle.inv_number);
        });
        const vehicle_inv_number = typeof vehicle.inv_number == 'string' ? vehicle.inv_number.split('/')[0] : vehicle.inv_number;
        const depot = get_vehicle_depot(vehicle.type, vehicle_inv_number);
        if(!depot) console.log(depot, vehicle.type, vehicle.inv_number);
        btn.setAttribute('data-depot-id', depot.id);
        btn.setAttribute('data-inv-number', vehicle.full_inv_number ?? vehicle.inv_number);
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
        btn.setAttribute('data-car', vehicle.car);
        btn.innerText = `${vehicle.car ? vehicle.car + ' / ' : ''}${proper_inv_number(vehicle.inv_number)}`;
        btns.push(btn);
    }
    btns.sort((a, b) => a.dataset.car - b.dataset.car);
    btns.forEach(btn => td.appendChild(btn));
    tr.appendChild(td);
    tbody.appendChild(tr);
}

function is_screen_width_lg_or_less() {
    return window.innerWidth <= 992;
}

function zoom_to_vehicle(type, inv_number) {
    const vehicle = cache.find(v => v.type === type && v.inv_number === inv_number);
    const marker = vehicle.marker;
    const vehicles_panel = document.querySelector('#vehicles-panel');
    if(is_screen_width_lg_or_less()){
        vehicles_panel.classList.add('d-none');
    }
    map.flyTo(vehicle.coords, 17, { animate: false });
    marker.fireEvent('click');
    register_vehicle_view(type, inv_number);
}
window.zoom_to_vehicle = zoom_to_vehicle;

function update_route_tables(route_tables) {
    for(const table of route_tables) {
        let [type, route_ref] = table.split('/');
        if(route_ref === 'undefined') {
            route_ref = 'outOfService';
        }
        
        const old_tbody = document.querySelector(`#${type}_${route_ref}`);
        try {
            const cgm_route_id = routes.find(route => route.type == type && route.route_ref == route_ref).cgm_id;
            const relevant_vehicles = cache.filter(vehicle => vehicle.cgm_route_id == cgm_route_id && vehicle.route_ref && vehicle.hidden !== true);
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
}


function hide_inactive_vehicles() {
    const update_tables = new Set();
    const now = Date.now() / 1000;
    cache.forEach(vehicle => {
        if(now - vehicle.timestamp <= 120) {
            return;
        }
        if(vehicle.marker) {
            vehicle.marker.remove();
            vehicle.marker = null;
        }
        vehicle.hidden = true;
        update_tables.add(`${vehicle.type}/${vehicle.route_ref}`);
    });
    update_route_tables(update_tables);
}

export function get_setting(key) {
    const defaults = {
        data_source: 'gtfs'
    };
    return localStorage.getItem(`livemap_${key}`) || defaults[key];
}

function set_setting(key, value) {
    localStorage.setItem(`livemap_${key}`, value);
}

function update_data_source(new_source) {
    const old_source = get_setting('data_source');
    if(new_source === old_source) {
        return;
    }
    set_setting('data_source', new_source);
    location.reload();
}
// window.update_data_source = update_data_source;

function init_settings() {
    const data_source = get_setting('data_source');
    const data_source_radios = document.querySelectorAll('input[name="positions_data_source"]');
    data_source_radios.forEach(radio => {
        radio.toggleAttribute('checked', radio.value === data_source);
        radio.addEventListener('change', (e) => {
            if(e.target.checked) {
                update_data_source(e.target.value);
            }
        });
    });
}
