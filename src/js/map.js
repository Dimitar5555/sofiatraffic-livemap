import { LocateControl } from 'leaflet.locatecontrol';

import { load_stops } from './map_stops';
import { show_stops_in_view } from './map_stops';
import { show_markers_in_view } from './map_vehicles';
import { cache } from './app';

const rtf1 = new Intl.RelativeTimeFormat("bg", { style: "short" });

export let map = null;
export let vehicles_layer = null;
export let stops_layer = null;

export function init_map() {
    map = L.map('map', {
        center: [42.69671, 23.32129],
        zoom: 15,
        zoomControl: false,
        maxBounds: [[42.9002, 23.0624], [42.5166, 23.6455]],
        minZoom: 13,
    });
    map.invalidateSize();
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    L.control.openVehiclesPanel({ position: 'topleft' }).addTo(map);
    L.control.openStopsPanel({ position: 'topleft' }).addTo(map);
    L.control.openInfoPanel({ position: 'topleft' }).addTo(map);
    L.control.openSettingsPanel({ position: 'topleft' }).addTo(map);
    L.control.zoom({
        position: 'topright'
    }).addTo(map);
    new LocateControl({position: 'topright'}).addTo(map);

    vehicles_layer = L.layerGroup().addTo(map);
    stops_layer = L.layerGroup().addTo(map);
    load_stops(stops_layer);

    map.on('load', () => {
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
}

export function determine_time_ago(timestamp) {
    const now = Date.now() / 1000;
    const diff = Math.floor(timestamp - now);
    if(Math.abs(diff) < 10) {
        return 'току-що';
    }
    return rtf1.format(diff, 'seconds');
}

export function update_time_elements() {
    const elements = document.querySelectorAll('#last-updated');
    const now = Date.now() / 1000;
    let size = 0;
    for(const span of elements) {
        size++;
        const timestamp = parseInt(span.getAttribute('data-timestamp'));
        if(isNaN(timestamp) || timestamp > now) {
            span.innerHTML = '';
            continue;
        }
        span.innerHTML = determine_time_ago(timestamp);
    }
    return size;
}

setInterval(update_time_elements, 1000);

function create_panel_control(icon_class, panel_selector) {
    return L.Control.extend({
        onAdd: function() {
            const div = L.DomUtil.create('div', 'leaflet-control-locate leaflet-bar leaflet-control');
            const a = L.DomUtil.create('a', 'leaflet-bar-part leaflet-bar-part-single');
            const i = L.DomUtil.create('i', icon_class);

            a.appendChild(i);
            div.appendChild(a);

            div.onclick = function() {
                const panel = document.querySelector(panel_selector);
                if (panel) {
                    panel.classList.remove('d-none');
                }

                if(panel_selector === '#stops-panel') {
                    update_stop_suggestions();
                }
            };

            return div;
        }
    });
}

L.Control.OpenInfoPanel = create_panel_control('bi bi-info-lg fs-3', '#info-panel');
L.Control.OpenVehiclesPanel = create_panel_control('bi bi-bus-front-fill fs-4', '#vehicles-panel');
L.Control.OpenStopsPanel = create_panel_control('bi bi-menu-button-wide fs-4', '#stops-panel');
L.Control.OpenSettingsPanel = create_panel_control('bi bi-gear-fill fs-4', '#settings-panel');

L.control.openInfoPanel = opts => new L.Control.OpenInfoPanel(opts);
L.control.openVehiclesPanel = opts => new L.Control.OpenVehiclesPanel(opts);
L.control.openStopsPanel = opts => new L.Control.OpenStopsPanel(opts);
L.control.openSettingsPanel = opts => new L.Control.OpenSettingsPanel(opts);
