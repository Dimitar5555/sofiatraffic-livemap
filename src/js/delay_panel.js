import { set_route_classes } from './utils.js';
import { cache } from './app.js';

export function update_delay_panel() {
    const delay_filter_el = document.querySelector('#delay_type_filter');
    const delay_filter = delay_filter_el.value;
    const vehicle_filter_el = document.querySelector('#delay_vehicle_type_filter');
    const vehicle_filter = vehicle_filter_el.value;

    const now_hh_mm = (new Date()).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }).split(':').map(Number); 
    const now_mins = (now_hh_mm[0] * 60 + now_hh_mm[1]) % (24 * 60); 
    const delays = Array.from(cache)
    .filter(([key, v]) => !v.hidden)
    .map(([key, v]) => ({
        route: v.route_ref,
        delay: v.delay,
        inv_number: v.inv_number,
        type: v.type,
        delay: now_mins - v.scheduled_time,
        cgm_id: key,
    }))
    .filter((v) => vehicle_filter == 'all' || v.type == vehicle_filter)
    .filter((v) => delay_filter == 'all' || delay_filter == 'early' && v.delay < -1 || delay_filter == 'ontime' && -1 <= v.delay && v.delay <= 3 || delay_filter == 'late' && 3 < v.delay);
    delays.sort((a, b) => b.delay - a.delay);

    const delay_table = document.querySelector('#delay_table');
    delay_table.innerHTML = '';
    for(const delay of delays) {
        const tr = document.createElement('tr');
        const span = document.createElement('span');
        set_route_classes(span, delay.type, delay.route);
        span.classList.add('text-nowrap');
        tr.innerHTML = `
            <td>${span.outerHTML}</td>
            <td><button class="btn btn-sm btn-outline-primary" onclick="zoom_to_vehicle('${delay.cgm_id}')">${delay.inv_number}</button></td>
            <td class="${-1 <= delay.delay && delay.delay <= 3 ? 'text-success' : 'text-danger'} ${delay.delay >= 10 ? 'fw-bold' : ''}">${delay.delay > 0 ? '+' : ''}${delay.delay} мин</td>
        `;
        delay_table.appendChild(tr);
    }
}
window.update_delay_panel = update_delay_panel;
