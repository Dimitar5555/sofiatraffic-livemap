import { get_setting } from './app.js';

export const MERGE_TRAM_COMPONENTS = true;
export const MIN_ACTIVE_SPEED = 3;
// const base_url = '://127.0.0.1:4000';
const base_url = 's://sofiatraffic-proxy-pr-4.onrender.com';
// export const WEBSOCKET_URL = `ws${base_url}/v2/livemap/`;
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
