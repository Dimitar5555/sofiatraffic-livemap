const models = {
    tram: [
        {
            name: 'PESA Swing',
            gauge: 1009,
            inv_number_ranges: [
                [2301, 2399]
            ]
        },
        {
            name: 'Tatra T6A2-SF',
            gauge: 1009,
            inv_number_ranges: [
                [2041, 2057]
            ]
        },
        {
            name: 'Tatra T6A2B',
            gauge: 1009,
            inv_number_ranges: [
                [2033, 2034],
                [3001, 3040]
            ]
        },
        {
            name: 'T8M-700 IT (Inekon)',
            gauge: 1009,
            inv_number_ranges: [
                [3401, 3420]
            ]
        },
        {
            name: 'Schindler Waggon Be 4/6',
            gauge: 1009,
            inv_number_ranges: [
                [601, 699]
            ]
        },
        {
            name: "T8M-500 F",
            gauge: 1009,
            inv_number_ranges: [
                [501, 599]
            ]
        },
        {
            name: "T8M-900 F",
            gauge: 1009,
            inv_number_ranges: [
                [901, 999]
            ]
        },
        {
            name: "T6M-700 F",
            gauge: 1009,
            inv_number_ranges: [
                [701, 899]
            ]
        },
        {
            name: "Tatra T6B5B",
            gauge: 1435,
            inv_number_ranges: [
                [4101, 4139]
            ]
        },
        {
            name: "Tatra T6A5",
            gauge: 1435,
            inv_number_ranges: [
                [4140, 4199]
            ]
        },
        {
            name: "Duewag GT8",
            gauge: 1435,
            inv_number_ranges: [
                [4401, 4450]
            ]
        }

    ],
    trolley: [
        {
            name: "Ikarus 280.92F",
            inv_number_ranges: [
                2108,
                2903
            ]
        },
        {
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
            name: "Skoda 26Tr Solaris",
            length: 12,
            inv_number_ranges: [
                [1601, 1649]
            ]
        },
        {
            name: "Skoda 27Tr Solaris III",
            length: 18,
            inv_number_ranges: [
                [1650, 1699],
                [2675, 2699]
            ]
        },
        {
            name: "Skoda 27Tr Solaris IV",
            length: 18,
            inv_number_ranges: [
                [2801, 2899]
            ]
        }
    ],
    bus: [
        {
            name: 'MAN Lion\'s City',
            length: 18,
            fuel: 'CNG',
            inv_number_ranges: [
                [1150, 1199],
                [1601, 1699],
                [2000, 2045],
                [2300, 2399],
                [3100, 3199]
            ]
        },
        {
            name: 'Yutong ZK6126HGA',
            inv_number_ranges: [
                [1201, 1299],
                [2046, 2099],
                [3600, 3649]
            ]
        },
        {
            name: 'Yutong ZK6126HGA CNG',
            inv_number_ranges: [
                [3650, 3699]
            ]
        },
        {
            name: 'BMC Procity CNG',
            inv_number_ranges: [
                [1401, 1499],
                [2500, 2599],
                [3400, 3499],
                [7041, 7171]
            ]
        },
        {
            name: 'Mercedes-Benz O345 Conecto G',
            inv_number_ranges: [
                [1100, 1138],
                [2161, 2172],
                [3301, 3399]
            ]
        },
        {
            name: 'Mercedes-Benz Conecto LF',
            inv_number_ranges: [
                [1801, 1899]
            ]
        },
        {
            name: 'Karsan e-JEST',
            inv_number_ranges: [
                [1010, 1099],
                [25010, 25050]
            ]
        },
        {
            name: 'BMC Belde 220-SLF',
            inv_number_ranges: [
                [2720, 2799],
                [3700, 3899]
            ]
        },
        {
            name: 'Higer KLQ6832GEV',
            inv_number_ranges: [
                [1701, 1703],
                [5001, 5099]
            ]
        },
        {
            name: 'Higer KLQ6832GEV3',
            length: 9,
            inv_number_ranges: [
                [2811, 2899]
            ]
        },
        {
            name: 'Yutong E12LF',
            inv_number_ranges: [
                [2800, 2899],
                [3011, 3099]
            ]
        },
        {
            name: 'Mercedes-Benz O345 Conecto S',
            inv_number_ranges: [
                [1901, 1999]
            ]
        },
        {
            name: 'MAN SG262',
            inv_number_ranges: [
                [2135, 2160]
            ]
        },
        {
            name: 'Mercedes-Benz Intouro',
            inv_number_ranges: [
                [1301, 1399]
            ]
        },
        {
            name: 'MAN A39 Lion\'s City DD',
            inv_number_ranges: [
                [2602, 2605]
            ]
        },
        {
            name: 'Mercedes-Benz O345 G',
            inv_number_ranges: [
                3592
            ]
        },
        {
            name: 'Neoplan Centroliner',
            inv_number_ranges: [
                2601
            ]
        },
        {
            name: 'MAN Lion\'s City',
            length: 12,
            fuel: 'CNG',
            inv_number_ranges: [
                7173,
                7175
            ]
        }
    ]
};

function get_vehicle_model(inv_number, type) {
    if(typeof inv_number === 'string') {
        inv_number = parseInt(inv_number.split('+')[0]);
    }

    for (const model of models[type]) {
        for (const range of model.inv_number_ranges) {
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
