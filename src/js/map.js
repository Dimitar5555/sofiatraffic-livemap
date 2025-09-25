const rtf1 = new Intl.RelativeTimeFormat("bg", { style: "short" });

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
