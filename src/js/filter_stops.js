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
    const old_td = document.querySelector('table#stops_table > tbody td');
    const term = document.querySelector('#stop_name_filter').value;
    const matches = filter_stops(term);
    console.log(term, matches);
    const new_td = document.createElement('td');
    for(const code of matches) {
        const stop = stops.get(code);
        const btn = document.createElement('button');
        btn.onclick = () => {
                map.flyTo(stop.coords, 18, {animate: false});
            setTimeout(() => {
                stop.marker.fire('click');
                if(is_screen_width_lg_or_less()) {
                    const panel = document.querySelector('#stops-panel');
                    panel.classList.add('d-none');
                }
            }, 50);
        };
        btn.classList.add('btn', 'btn-light', 'w-100', 'text-start', 'mb-1', 'px-1');
        const code_text = stop.code.toString().padStart(4, '0');
        const name_text = stop.names.bg;
        btn.textContent = `[${code_text}] ${name_text}`;
        new_td.appendChild(btn);
    }
    old_td.replaceWith(new_td);
}