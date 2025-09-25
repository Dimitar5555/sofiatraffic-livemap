function filter_depots_by_type(type) {
    const depot_el = document.querySelector('#vehicle_depot');
    const options = depot_el.querySelectorAll('option');
    for(let option of options) {
        if(type == 0 || option.value == 0 || option.dataset.type == type || option.dataset.type.includes(type)) {
            option.hidden = '';
            continue;
        }
        option.hidden = 'hidden';
    }

    if(depot_el.options[depot_el.selectedIndex].hidden != '') {
        depot_el.selectedIndex = 0;
    }
}

function filter_by_all_params(type, depot_id, inv_number, is_double_decker, is_unexpected) {
    const vehicles_table = document.querySelector('#vehicles_table');
    const tbodies = Array.from(vehicles_table.querySelectorAll('tbody'));
    for(let tbody of tbodies) {
        const is_type_okay = type == 0 || tbody.dataset.type == type;
        const is_double_decker_okay = !is_double_decker || tbody.dataset.doubleDecker;
        const is_unexpected_okay = !is_unexpected || tbody.dataset.unexpected;
        if(!is_type_okay || !is_double_decker_okay || !is_unexpected_okay) {
            tbody.classList.add('d-none');
            continue;
        }
        let has_vehicles = false;
        const trs = Array.from(tbody.querySelectorAll('button[data-depot-id]'));
        for(const tr of trs) {
            const is_depot_ok = depot_id == 0 || tr.dataset.depotId == depot_id;
            const is_inv_number_ok = inv_number == 0 
            || inv_number == tr.dataset.invNumber 
            || tr.dataset.invNumber.includes(inv_number)
            || tr.dataset.invNumber.includes('/') && tr.dataset.invNumber.includes(inv_number);
            const is_double_decker_ok = !is_double_decker || tr.dataset.doubleDecker;
            const is_unexpected_ok = !is_unexpected || tr.dataset.isUnexpected == 'true';
            
            if(!is_depot_ok || !is_inv_number_ok || !is_double_decker_ok || !is_unexpected_ok) {
                tr.classList.add('d-none');
                continue;
            }
            has_vehicles = true;
            tr.classList.remove('d-none');
        }
        if(!has_vehicles) {
            tbody.classList.add('d-none');
            continue;
        }
        tbody.classList.remove('d-none');
    }
}

function apply_filters() {
    const type_el = document.querySelector('#vehicle_type');
    const depot_el = document.querySelector('#vehicle_depot');
    const inv_number_el = document.querySelector('#vehicle_inv_number');
    const double_decker_el = document.querySelector('#vehicle_double_decker');
    const unexpected_el = document.querySelector('#vehicle_unexpected');

    let type = type_el.value;
    type ??= 0;
    filter_depots_by_type(type);
    let depot_id = depot_el.options[depot_el.selectedIndex].dataset.depot_id;
    depot_id ??= 0;
    let depot_type = depot_el.options[depot_el.selectedIndex].dataset.type;
    depot_type ??= 0;
    let inv_number = inv_number_el.value?inv_number_el.value:false;
    inv_number ??= 0;
    const is_double_decker = double_decker_el.checked;
    const is_unexpected = unexpected_el.checked;

    filter_by_all_params(type, depot_id, inv_number, is_double_decker, is_unexpected);
}
