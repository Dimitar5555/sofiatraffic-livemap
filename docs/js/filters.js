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

function filter_by_all_params(type, depot_id, inv_number) {
    const vehicles_table = document.querySelector('#vehicles_table');
    const tbodies = Array.from(vehicles_table.querySelectorAll('tbody'));
    for(let tbody of tbodies) {
        let is_type_okay = type == 0 || tbody.dataset.type == type;
        if(!is_type_okay) {
            tbody.classList.add('d-none');
            continue;
        }
        let has_vehicles = false;
        const trs = Array.from(tbody.querySelectorAll('tr[data-depot-id]'));
        for(let tr of trs) {
            let is_depot_ok = depot_id == 0 || Number(tr.dataset.depotId) == depot_id;
            let is_inv_number_ok = inv_number == 0 
            || inv_number == tr.dataset.invNumber 
            || tr.dataset.invNumber.includes(inv_number)
            || tr.dataset.invNumber.includes('+') && tr.dataset.invNumber.includes(inv_number);
            
            if(!is_depot_ok || !is_inv_number_ok) {
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

    let type = type_el.value;
    type ??= 0;
    filter_depots_by_type(type);
    let depot_id = depot_el.options[depot_el.selectedIndex].dataset.depot_id;
    depot_id ??= 0;
    let depot_type = depot_el.options[depot_el.selectedIndex].dataset.type;
    depot_type ??= 0;
    let inv_number = inv_number_el.value?inv_number_el.value:false;
    inv_number ??= 0;

    filter_by_all_params(type, depot_id, inv_number);
}