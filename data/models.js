const models = {
    tram: [
        {
            id: 'pesa_swing',
            name: 'PESA Swing',
            gauge: 1009,
            inv_number_ranges: [
                [2301, 2399]
            ],
            extras: ['ac', 'low_floor']
        },
        {
            id: 'tatra_t6a2_sf',
            name: 'Tatra T6A2-SF',
            gauge: 1009,
            inv_number_ranges: [
                [2041, 2057]
            ]
        },
        {
            id: 'tatra_t6a2b',
            name: 'Tatra T6A2B',
            gauge: 1009,
            inv_number_ranges: [
                [2033, 2034],
                [3001, 3040]
            ]
        },
        {
            id: 'inekon',
            name: 'T8M-700 IT (Inekon)',
            gauge: 1009,
            inv_number_ranges: [
                [3401, 3420]
            ],
            extras: ['low_floor']
        },
        {
            id: 'schindler',
            name: 'Schindler Waggon Be 4/6',
            gauge: 1009,
            inv_number_ranges: [
                [601, 699]
            ],
            extras: ['low_floor']
        },
        {
            id: 't8m_500_f',
            name: "T8M-500 F",
            gauge: 1009,
            inv_number_ranges: [
                [501, 599]
            ]
        },
        {
            id: 't8m_900_f',
            name: "T8M-900 F",
            gauge: 1009,
            inv_number_ranges: [
                [901, 999]
            ],
            extras: ['low_floor']
        },
        {
            id: 't6m_700_f',
            name: "T6M-700 F",
            gauge: 1009,
            inv_number_ranges: [
                [701, 899]
            ]
        },
        {

            id: 'tatra_t6b5b',
            name: "Tatra T6B5B",
            gauge: 1435,
            inv_number_ranges: [
                [4101, 4139]
            ]
        },
        {
            id: 'tatra_t6a5',
            name: "Tatra T6A5",
            gauge: 1435,
            inv_number_ranges: [
                [4140, 4199]
            ]
        },
        {
            id: 'duewag_gt8',
            name: "Duewag GT8",
            gauge: 1435,
            inv_number_ranges: [
                [4401, 4450]
            ]
        }

    ],
    trolley: [
        {
            id: 'ikarus_facelift',
            name: "Ikarus 280.92F",
            inv_number_ranges: [
                2108,
                2903
            ]
        },
        {
            id: 'ikarus',
            name: "Ikarus 280.92",
            inv_number_ranges: [
                2123,
                2702,
                2703,
                2913,
                2915
            ]
        },
        {
            id: 'skoda_26tr',
            name: "Skoda 26Tr Solaris",
            length: 12,
            inv_number_ranges: [
                [1601, 1649]
            ],
            extras: ['ac', 'low_floor']
        },
        {
            id: 'skoda_27tr_3',
            name: "Skoda 27Tr Solaris III",
            length: 18,
            inv_number_ranges: [
                [1650, 1699],
                [2675, 2699]
            ],
            extras: ['ac', 'low_floor']
        },
        {
            id: 'skoda_27tr_4',
            name: "Skoda 27Tr Solaris IV",
            length: 18,
            inv_number_ranges: [
                [2801, 2899]
            ],
            extras: ['ac', 'low_floor']
        }
    ],
    bus: [
        {
            id: 'man_lions_city_g',
            name: 'MAN Lion\'s City',
            length: 18,
            fuel: 'CNG',
            inv_number_ranges: [
                [1150, 1199],
                [1601, 1699],
                [2000, 2045],
                [2300, 2399],
                [3100, 3199]
            ],
            extras: ['ac', 'low_floor']
        },
        {
            id: 'yutong_diesel',
            name: 'Yutong ZK6126HGA',
            inv_number_ranges: [
                [1201, 1299],
                [2046, 2099],
                [3600, 3649]
            ],
            extras: ['ac', 'low_floor']
        },
        {
            id: 'yutong_cng',
            name: 'Yutong ZK6126HGA CNG',
            inv_number_ranges: [
                [3650, 3699]
            ],
            extras: ['ac', 'low_floor']
        },
        {
            id: 'bmc_procity',
            name: 'BMC Procity CNG',
            inv_number_ranges: [
                [1401, 1499],
                [2500, 2599],
                [3400, 3499],
                [7041, 7171]
            ],
            extra_check: (vehicle) => {
                return vehicle.cgm_id.startsWith('A');
            },
            extras: ['ac', 'low_floor']
        },
        {
            id: 'mb_conecto_g',
            name: 'Mercedes-Benz O345 Conecto G',
            inv_number_ranges: [
                [1100, 1138],
                [2161, 2172],
                [3301, 3399]
            ]
        },
        {
            id: 'mb_conecto_lf',
            name: 'Mercedes-Benz Conecto LF',
            inv_number_ranges: [
                [1801, 1899]
            ],
            extras: ['low_floor']
        },
        {
            id: 'karsan_ejest',
            name: 'Karsan e-JEST',
            inv_number_ranges: [
                [1010, 1099],
                [2501, 2505]
            ],
            extra_check: (vehicle) => {
                return vehicle.cgm_id.startsWith('TB');
            },
            extras: ['ac', 'low_floor']
        },
        {
            id: 'bmc_belde',
            name: 'BMC Belde 220-SLF',
            inv_number_ranges: [
                [2720, 2799],
                [3700, 3899]
            ],
            extras: ['low_floor']
        },
        {
            id: 'higer_12m',
            name: 'Higer KLQ6832GEV',
            inv_number_ranges: [
                [1701, 1703],
                [5001, 5099]
            ],
            extras: ['ac', 'low_floor']
        },
        {
            id: 'higer_9m',
            name: 'Higer KLQ6832GEV3',
            length: 9,
            inv_number_ranges: [
                [2811, 2899]
            ]
        },
        {
            id: 'yutong_electric',
            name: 'Yutong E12LF',
            inv_number_ranges: [
                [2800, 2899],
                [3011, 3099]
            ],
            extras: ['ac', 'low_floor']
        },
        {
            id: 'mb_conecto_s',
            name: 'Mercedes-Benz O345 Conecto S',
            inv_number_ranges: [
                [1901, 1999]
            ]
        },
        {
            id: 'man_sg262',
            name: 'MAN SG262',
            inv_number_ranges: [
                [2135, 2160]
            ]
        },
        {
            id: 'mb_intouro',
            name: 'Mercedes-Benz Intouro',
            inv_number_ranges: [
                [1301, 1399]
            ],
            extras: ['ac']
        },
        {
            id: 'man_dd',
            name: 'MAN A39 Lion\'s City DD',
            inv_number_ranges: [
                [2602, 2605]
            ],
            extras: ['ac', 'low_floor', 'double_decker']
        },
        {
            id: 'mb_o345g',
            name: 'Mercedes-Benz O345 G',
            inv_number_ranges: [
                3592
            ]
        },
        {
            id: 'neoplan_dd',
            name: 'Neoplan Centroliner',
            inv_number_ranges: [
                2601
            ],
            extras: ['ac', 'low_floor', 'double_decker']
        },
        {
            id: 'man_lions_city_12m',
            name: 'MAN Lion\'s City',
            length: 12,
            fuel: 'CNG',
            inv_number_ranges: [
                7173,
                7175
            ],
            extras: ['ac', 'low_floor']
        }
    ]
};

export function get_vehicle_model(vehicle) {
    const { type, cgm_id } = vehicle;
    let { inv_number } = vehicle;
    if(typeof inv_number === 'string') {
        inv_number = parseInt(inv_number.split('/')[0]);
    }
    for (const model of models[type]) {
        for (const range of model.inv_number_ranges) {
            if(model.extra_check && !model.extra_check(vehicle)) {
                continue;
            }
            if(typeof range === 'object') {
                const [lb, rb] = range;
                if (lb <= inv_number && inv_number <= rb) {
                    return model;
                }
            }
            else {
                if (range === inv_number) {
                    return model;
                }
            }
        }
    }
    return { name: "Неизвестен модел" };
}

export function get_vehicle_model_name(vehicle) {
    const model = get_vehicle_model(vehicle);
    return get_model_name(model);
}

export const models_by_type_and_models = {
    tram: models.tram.reduce((obj, item) => (obj[item.id] = item, obj), {}),
    trolley: models.trolley.reduce((obj, item) => (obj[item.id] = item, obj), {}),
    bus: models.bus.reduce((obj, item) => (obj[item.id] = item, obj), {})
};

export function get_model_name(model) {
    const name = model.name ?? "Неизвестен модел";
    const fuel = model.fuel ?? '';
    const length = model.length ? `(${model.length} m)` : '';
    return [name, fuel, length].filter(x => x).join(' ');
}