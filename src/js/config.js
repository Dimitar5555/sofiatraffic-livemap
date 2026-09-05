import { get_setting } from './app.js';

export const MERGE_TRAM_COMPONENTS = true;
export const MIN_ACTIVE_SPEED = 3;
// const base_url = '://127.0.0.1:4000';
const base_url = 's://sofiatraffic-proxy.onrender.com';
const livemap_urls = {
    'avl': `ws${base_url}/livemap/`,
    'gtfs': `ws${base_url}/v2/livemap/`,
};
export const WEBSOCKET_URL = livemap_urls[get_setting('data_source')];
export const VIRTUAL_BOARD_URL = `http${base_url}/v2/virtual-board?stop_code=`;
export const DEBUG_MODE = false;
export const BG_TYPES = {
    'tram': 'Трамвай',
    'trolley': 'Тролей',
    'bus': 'Автобус'
};

export const BG_TYPES_HTML = {
    'tram': `<i class="icon tram-icon"></i>`,
    'trolley': `<i class="icon trolley-icon"></i>`,
    'bus': `<i class="icon bus-icon"></i>`,
    'night': `<i class="icon night-icon"></i>`
};

export const occupancy_mappings = {
    'EMPTY': 'Свободен',
    'MANY_SEATS_AVAILABLE': 'Много места',
    'FEW_SEATS_AVAILABLE': 'Малко места',
    'STANDING_ROOM_ONLY': 'Само правостоящи',
    'CRUSHED_STANDING_ROOM_ONLY': 'Претъпкан',
    'FULL': 'Пълен',
    'NOT_ACCEPTING_PASSENGERS': 'Не приема пътници',
    'NO_DATA_AVAILABLE': 'Няма данни',
    'NOT_BOARDABLE': 'Не превозва пътници',
    null: 'Няма данни'
};
