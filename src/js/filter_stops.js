import { map } from './map.js';
import { stops } from './map_stops.js';
import { is_screen_width_lg_or_less } from './app.js';

function filter_stops(term) {
    const matches = [];
    const max_shown_stops = 15;
    term = term.trim().toLowerCase();
    const lacks_term = term.length == 0;
    for(const [code, stop] of stops.entries()) {
        const name = stop.names.bg.toLowerCase();
        const name_match = name.includes(term);
        const code_match = stop.code.toString().padStart(4, '0').includes(term);
        if(name_match || code_match || lacks_term) {
            matches.push(code);
        }
        if(matches.length >= max_shown_stops) {
            break;
        }
    }
    return matches;
}

window.update_stop_suggestions = function() {
    const old_tbody = document.querySelector('table#stops_table > tbody');
    const term = document.querySelector('#stop_name_filter').value;
    const matches = filter_stops(term);
    console.log(term, matches);
    const new_tbody = document.createElement('tbody');
    for(const code of matches) {
        const stop = stops.get(code);
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => {
            map.flyTo(stop.coords, 18, {animate: false});
            setTimeout(() => {
                stop.marker.fire('click');
                if(is_screen_width_lg_or_less()) {
                    const panel = document.querySelector('#stops-panel');
                    panel.classList.add('d-none');
                }
            }, 50);
        }
        const td = document.createElement('td');
        const code_text = stop.code.toString().padStart(4, '0');
        const name_text = stop.names.bg;
        td.textContent = `[${code_text}] ${name_text}`;
        tr.appendChild(td);
        new_tbody.appendChild(tr);
    }
    old_tbody.replaceWith(new_tbody);
}