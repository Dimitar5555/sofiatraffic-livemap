import { routes, cache } from './app';
import { occupancy_mappings, VIRTUAL_BOARD_URL, occupancy_mappings, BG_TYPES } from './config';
import { get_route_classes, calculate_diff } from './utils';
import { determine_time_ago } from './map';
import { get_vehicle_model, get_model_name } from '/data/models';
import { find_vehicle_in_cache } from './cache';

export const stops = new Map();

function is_metro_stop(stop_code){
    return 2900 < Number(stop_code) && Number(stop_code) < 3400
}

export function load_stops() {
    fetch('https://raw.githubusercontent.com/Dimitar5555/sofiatraffic-schedules/refs/heads/master/data/stops.json')
    .then(response => response.json())
    .then(data => {
        for(const stop of data) {
            if(is_metro_stop(stop.code)){
                continue;
            }
            stops.set(stop.code, stop);
        }
    })
    .catch(error => console.error('Error loading stops:', error));
}

function get_stop_marker(stop) {
    if(stop.marker) {
        return stop.marker;
    }
    const stop_icon = new L.DivIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
        <circle cx="12" cy="12" r="10" fill="#3388ff"/>
        <circle cx="12" cy="12" r="8" fill="#fff"/>
        </svg>`,
        iconSize: [24, 24]
    });
    const marker = L.marker(stop.coords);
    marker.setIcon(stop_icon);
    marker
    .on('mouseover', (e) => {
        if(!e.target.getTooltip()) {
            const tooltip_text = generate_stop_tooltip_text(stop);
            const options = {
                className: 'fs-6',
                direction: 'top',
                permanent: false,
                offset: [0, -10],
                interactive: true,
                bubblingMouseEvents: false
            };
            e.target.bindTooltip(tooltip_text, options).openTooltip();
        }
    })
    .on('click', async (e) => {
        await update_stop_times(stop.code);
    })
    .on('popupclose', (e) => {
        e.target.unbindPopup();
    });
    stop.marker = marker;
    return marker;
}

async function update_stop_times(stop_code) {
    const panel = document.querySelector('#virtual-board-panel');
    const refresh_btn = panel.querySelector('#refresh-virtual-board');
    const last_updated_el = panel.querySelector('#last-updated');
    last_updated_el.setAttribute('data-timestamp', '');
    last_updated_el.textContent = '';
    refresh_btn.dataset.code = stop_code;
    refresh_btn.disabled = true;
    {
        const old_tbody = panel.querySelector('tbody');
        const loading_tbody = document.createElement('tbody');
        const loading_row = document.createElement('tr');
        const loading_td = document.createElement('td');
        loading_td.classList.add('text-center', 'py-3');
        loading_td.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"></div> Зареждане...';
        loading_row.appendChild(loading_td);
        loading_tbody.appendChild(loading_row);

        old_tbody.replaceWith(loading_tbody);
    }
    const stop = stops.get(stop_code);
    panel.querySelector('#stop_name').textContent = `[${stop.code.toString().padStart(4, '0')}] ${stop.names.bg}`;
    panel.classList.remove('d-none');
    const times = await load_stop_times(stop.code);
    const new_tbody = display_stop_times(times);
    const old_tbody = panel.querySelector('tbody');
    if(old_tbody) {
        old_tbody.replaceWith(new_tbody);
        refresh_stop_times();
    }
    refresh_btn.disabled = false;
    last_updated_el.setAttribute('data-timestamp', (Date.now() / 1000).toString());
    last_updated_el.textContent = determine_time_ago(Date.now() / 1000);
}
window.update_stop_times = update_stop_times;

function are_stops_shown(map) {
    const zoom = map.getZoom();
    return zoom >= 17;
}

export function show_stops_in_view(map, stops_layer) {
    if(!are_stops_shown(map)) {
        stops_layer.clearLayers();
        return;
    }
    const bounds = stops_layer._map.getBounds();
    for(const stop of stops.values()) {
        if(bounds.contains(stop.coords)) {
            const marker = get_stop_marker(stop);
            marker.addTo(stops_layer);
        }
    }
}

function generate_stop_tooltip_text(stop) {
    return `[${stop.code.toString().padStart(4, '0')}] ${stop.names.bg}`;
}

function generate_stop_popup_text(stop) {
    const name = stop.names.bg;
    return '<div class="text-center">'
    + `[${stop.code.toString().padStart(4, '0')}] ${name}`
    + `<table class="table table-sm table-bordered" id="stop-times" class="mt-2"><tbody><tr><td>Зареждане...</td></tr></tbody></table>`
    + '</div>';
}

async function load_stop_times(stop_code) {
    const req = await fetch(`${VIRTUAL_BOARD_URL}${stop_code.toString().padStart(4, '0')}`);
    const data = await req.json();
    if(data.error) {
        console.error('Error loading stop times:', data.error);
        return [];
    }

    data.routes.sort((a, b) => {
        const route_a = routes.findIndex(r => r.cgm_id == a.cgm_id);
        const route_b = routes.findIndex(r => r.cgm_id == b.cgm_id);
        return route_a - route_b;
    });
    return data.routes;
}

function refresh_stop_times(style) {
    if(!style) {
        style = localStorage.getItem('livemap_stop_time_style') || 'relative';
    }
    localStorage.setItem('livemap_stop_time_style', style);
    const panel = document.querySelector('#virtual-board-panel');
    const elements = panel.querySelectorAll('span[data-stop-time]');
    const now1 = new Date();
    const now_hour = now1.getHours() * 60;
    const now_minute = now1.getMinutes();
    const current_time = now_hour + now_minute;
    for(const el of elements) {
        const stop_time = Number(el.getAttribute('data-stop-time'));
        if(style == 'relative') {
            const diff = stop_time - current_time;
            el.textContent = `${diff} мин.`;
        }
        else {
            const hour = Math.floor(stop_time / 60) % 24;
            const minute = (stop_time % 60).toString().padStart(2, '0');
            el.textContent = `${(hour % 24).toString().padStart(2, '0')}:${minute}`;
        }
    }
}
window.refresh_stop_times = refresh_stop_times;

function display_stop_times(stop_routes) {
    function display_hours(scheduled, actual) {
        const total_diff = calculate_diff(scheduled, actual);

        const diff_class = 3 < total_diff || total_diff < -1 ? 'text-danger fw-bold' : 'text-success';
        const diff_html = `<span class="${diff_class} text-nowrap">${total_diff > 0 ? '+' : ''}${total_diff == 0 ? 'навреме' : total_diff + ' мин.'}</span>`;
                
        const actual_formatted = `<span data-stop-time="${actual}"></span>`;
        
        return [actual_formatted, total_diff === null ? null : diff_html];
    }

    const tbody = document.createElement('tbody');
    let first_row = true;
    let row_counter = 0;
    for(const route of stop_routes) {
        const row0 = document.createElement('tr');
        row0.classList.add('text-center', 'align-middle');

        const { type, route_ref } = routes.find(r => r.cgm_id == route.cgm_id);
        {
            const td = document.createElement('td');
            td.colSpan = '4';
            const span = document.createElement('span');
            span.setAttribute('class', get_route_classes(type, route_ref).join(' '));
            span.textContent = route_ref;
            td.appendChild(span);

            const i = document.createElement('i');
            i.setAttribute('class', 'bi bi-caret-right-fill mx-1');
            td.appendChild(i);

            td.appendChild(document.createTextNode(stops.get(route.destination)?.names.bg || 'неизвестна'));
            row0.appendChild(td);
        }
        const row = document.createElement('tr');
        row.classList.add('text-center', 'align-middle');
        {
            let col_counter = 0;
            for(const { actual_time, scheduled_time, occupancy: vehicle_occupancy, cgm_vehicle_id, next_stop } of route.times) {
                const td = document.createElement('td');
                const r = display_hours(scheduled_time, actual_time);
                const vehicle = find_vehicle_in_cache(cache, false, { cgm_id: cgm_vehicle_id });
                const model = vehicle ? get_vehicle_model(vehicle) : null;

                let popover_content = ``;
                popover_content += `${BG_TYPES[type]} ${vehicle?.inv_number ?? 'неизвестен'}<br>`;
                popover_content += model ? `Модел: ${get_model_name(model)}<br>` : '';

                const extras_icons = {
                    'ac': '<i class="bi bi-snow"></i>',
                    'low_floor': '<i class="bi bi-person-wheelchair"></i>'
                }
                const extras_text = model && model.extras ? model.extras.map(extra => extras_icons[extra] || '').join(' ') : '';
                popover_content += `Екстри: ${extras_text}<br>`;

                const next_stop_obj = next_stop ? stops.get(next_stop) : null;
                if(next_stop_obj) {
                    popover_content += `Следваща спирка: [${next_stop_obj.code.toString().padStart(4, '0')}] ${next_stop_obj.names.bg}<br>`;
                }
                
                let occupancy = occupancy_mappings[vehicle_occupancy];
                popover_content += `Запълненост: ${occupancy}<br>`;

                popover_content = popover_content.replace(/'/g, "&apos;").replace(/"/g, "&quot;");

                const anchor_handle = `--stop-time-${row_counter}-${col_counter}`;
                const popover_btn = `<i popovertarget="stop-time-popover" onclick="document.querySelector('#stop-time-popover').innerHTML = decodeURI(this.dataset.popoverContent); document.querySelector('#stop-time-popover').setAttribute('style', 'position-anchor: ${anchor_handle};'); document.querySelector('#stop-time-popover').showPopover();" data-popover-content='${popover_content}' class="bi bi-info-circle"></i>`;
                td.innerHTML = `<span class="text-nowrap" style="anchor-name: ${anchor_handle}">${r[0]} ${r[0] != '-' ? popover_btn : ''}</span><br>${r[1] ? r[1] : ''}`;
                if(first_row) {
                    td.classList.add('col-3');
                }
                row.appendChild(td);
                col_counter += 1;
            }
            for(let i = route.times.length; i < 4; i++) {
                const td = document.createElement('td');
                td.textContent = '-';
                if(first_row) {
                    td.classList.add('col-3');
                }
                row.appendChild(td);
            }
            first_row = false;
        }
        tbody.appendChild(row0);
        tbody.appendChild(row);
        row_counter += 1;
    }
    if(stop_routes.length == 0) {
        const row = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan', '4');
        td.textContent = 'Няма предстоящи пристигания';
        row.appendChild(td);
        tbody.appendChild(row);
    }
    return tbody;
}