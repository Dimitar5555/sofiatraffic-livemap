const WEBSOCKET_URL = 'wss://damp-unit-e9e4.bulgariadb.workers.dev/';
const DEBUG_MODE = false;
const MIN_ACTIVE_SPEED = 10;
var websocket_connection = null;
cache = [];

function init_map() {
    map = L.map('map', {
        center: [42.69671, 23.32129],
        zoom: 13
    });
    map.invalidateSize();
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);

    let icon_data = {
        passive: {
            iconSize: [25, 25],
            iconAnchor: [12.5, 12.5],
            popupAnchor: [0, -12.5],
            html: '<svg width="25" height="25" xmlns="http://www.w3.org/2000/svg"><circle cx="12.5" cy="12.5" r="12.5"/><circle cx="12.5" cy="12.5" r="4.75" fill="#fff"/></svg>'
        },
        active: {
            iconSize: [25, 41],
            //iconAnchor: [12.5, 41],
            iconAnchor: [12.5, 12.5],
            popupAnchor: [12.5, -2],
            rotationOrigin: '12.5px 12.5px',
            html: '<svg width="25" height="41" xmlns="http://www.w3.org/2000/svg"><circle cx="12.5" cy="12.5" r="12.5"/><polygon points="1.75,18.75 23.25,18.75 12.5,41" /><circle cx="12.5" cy="12.5" r="4.75" fill="#fff"/></svg>',
        }
    }

    marker_icons = {
        tram: {
            active: L.divIcon({
                iconSize: icon_data.active.iconSize,
                iconAnchor: icon_data.active.iconAnchor,
                popupAnchor: icon_data.active.popupAnchor,
                rotationOrigin: icon_data.active.rotationOrigin,
                html: icon_data.active.html,
                className: 'vehicle-tram'
            }),
            passive: L.divIcon({
                iconSize: icon_data.passive.iconSize,
                iconAnchor: icon_data.passive.iconAnchor,
                popupAnchor: icon_data.passive.popupAnchor,
                html: icon_data.passive.html,
                className: 'vehicle-tram'
            })      
            
        },
        trolley: {
            active: L.divIcon({
                iconSize: icon_data.active.iconSize,
                iconAnchor: icon_data.active.iconAnchor,
                popupAnchor: icon_data.active.popupAnchor,
                rotationOrigin: icon_data.active.rotationOrigin,
                html: icon_data.active.html,
                className: 'vehicle-trolley'
            }),
            passive: L.divIcon({
                iconSize: icon_data.passive.iconSize,
                iconAnchor: icon_data.passive.iconAnchor,
                popupAnchor: icon_data.passive.popupAnchor,
                html: icon_data.passive.html,
                className: 'vehicle-trolley'
            })      
            
        },
        bus: {
            active: L.divIcon({
                iconSize: icon_data.active.iconSize,
                iconAnchor: icon_data.active.iconAnchor,
                popupAnchor: icon_data.active.popupAnchor,
                rotationOrigin: icon_data.active.rotationOrigin,
                html: icon_data.active.html,
                className: 'vehicle-bus'
            }),
            passive: L.divIcon({
                iconSize: icon_data.passive.iconSize,
                iconAnchor: icon_data.passive.iconAnchor,
                popupAnchor: icon_data.passive.popupAnchor,
                html: icon_data.passive.html,
                className: 'vehicle-bus'
            })      
            
        }
};
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
        if(depot.geometry) {
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

function update_map_vehicle(new_vehicle) {
    let vehicle_marker = false;
    if(new_vehicle.marker) {
        vehicle_marker = new_vehicle.marker;
    }
    let vehicle_state = new_vehicle.geo.speed>MIN_ACTIVE_SPEED?'active':'passive';
    let vehicle_icon = marker_icons[new_vehicle.type][vehicle_state];
    let popup_text = `${proper_inv_number(new_vehicle.inv_number)} на <span class="${get_route_classes(new_vehicle.type).join(' ')}">${bg_types[new_vehicle.type]} ${new_vehicle.route_ref??"N/A"}</span><br><i class="bi bi-speedometer"></i>: ${new_vehicle.geo.speed} km/h`;
    let new_lat_lon = new L.LatLng(...new_vehicle.geo.curr.coords);
    if(!vehicle_marker) {
        const marker_options = {
            icon: vehicle_icon,
        }
        const popup_options = {
            className : 'fs-5'
        }        
        vehicle_marker = L.marker(new_lat_lon, marker_options).bindPopup(popup_text, popup_options).addTo(map);
        new_vehicle.marker = vehicle_marker;
    }
    else {
        vehicle_marker.setIcon(vehicle_icon).bindPopup(popup_text);
    }
    vehicle_marker.setLatLng(new_lat_lon);
    let bearing = new_vehicle.geo.speed>MIN_ACTIVE_SPEED?(new_vehicle.geo.bearing?new_vehicle.geo.bearing-180:0):0;
    vehicle_marker.setRotationAngle(bearing);
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
        let vehicle_inv_number = proper_inv_number_for_sorting(vehicle.inv_number);
        let elligible_depots = depots_data.filter(depot => depot.type == type || depot.type.includes(type));
        let depot = elligible_depots.find(d => d.is_depot_vehicle(vehicle_inv_number, vehicle.type))    
        tr.setAttribute('data-depot-id', depot.id);
        tr.setAttribute('data-inv-number', vehicle.inv_number);
        // tr.setAttribute('data-type', type);
        {
            let td = document.createElement('td');
            td.innerText = proper_inv_number(vehicle.inv_number);
            tr.appendChild(td);
        }
        {
            let td = document.createElement('td');
            td.innerHTML = `<button class="btn btn-outline-success" onclick="zoom_to_vehicle('${vehicle.type}', '${vehicle.inv_number}')">Покажи на картата</button>`;
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

function zoom_to_vehicle(type, inv_number) {
    let marker = cache.find(v => v.type == type && v.inv_number == inv_number).marker;
    marker.openPopup();
    map.flyTo(marker._latlng, 17);
}

function update_route_table(type, route_ref) {
    let old_tbody = document.querySelector(`#${type}_${route_ref}`);
    try {
        let new_tbody = old_tbody.cloneNode();
        let relevant_vehicles = cache.filter(vehicle => vehicle.type == type && vehicle.route_ref == route_ref);
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

function determine_vehicle_depot(type, inv_number) {
    return depots_data.find(depot => depot.type == type && depot.is_in_depot(inv_number));
}