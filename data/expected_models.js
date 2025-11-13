import { depots_by_name as depots, get_vehicle_depot } from '/data/depots';
import { models_by_type_and_models as models, get_vehicle_model } from '/data/models';

const expected_models_per_line = [
    {
        route_ref: 1,
        type: 'tram',
        models: [
            {
                model: models.tram.tatra_t6a2_sf,
                depot: depots.krasna_polyana
            }
        ]
    },
    {
        route_ref: 3,
        type: 'tram',
        models: [
            {
                model: models.tram.tatra_t6a2_sf,
                depot: depots.krasna_polyana
            }
        ]
    },
    {
        route_ref: 4,
        type: 'tram',
        models: [
            {
                model: models.tram.pesa_swing,
                depot: depots.krasna_polyana
            }
        ]
    },
    {
        route_ref: 5,
        type: 'tram',
        models: [
            {
                model: models.tram.pesa_swing,
                depot: depots.krasna_polyana
            }
        ]
    },
    {
        route_ref: 6,
        type: 'tram',
        models: [
            {
                model: models.tram.inekon,
                depot: depots.banishora
            },
            {
                model: models.tram.pesa_swing,
                depot: depots.krasna_polyana
            }
        ]
    },
    {
        route_ref: 7,
        type: 'tram',
        models: [
            {
                model: models.tram.pesa_swing,
                depot: depots.krasna_polyana
            }
        ]
    },
    // TODO tram 8
    {
        route_ref: 10,
        type: 'tram',
        models: [
            {
                model: models.tram.tatra_t6a2b,
                depot: depots.banishora
            }
        ]
    },
    {
        route_ref: 11,
        type: 'tram',
        models: [
            {
                model: models.tram.inekon,
                depot: depots.banishora
            },
            {
                model: models.tram.t8m_500_f,
                depot: depots.banishora
            }
        ]
    },
    {
        route_ref: 12,
        type: 'tram',
        models: [
            {
                model: models.tram.schindler,
                depot: depots.banishora
            }
        ]
    },
    {
        route_ref: 15,
        type: 'tram',
        models: [
            {
                model: models.tram.tatra_t6a2b,
                depot: depots.banishora
            }
        ]
    },
    {
        route_ref: 18,
        type: 'tram',
        models: [
            {
                model: models.tram.pesa_swing,
                depot: depots.krasna_polyana
            }
        ]
    },
    {
        route_ref: 20,
        type: 'tram',
        models: [
            {
                model: models.tram.tatra_t6b5b,
                depot: depots.iskar_tram
            }
        ]
    },
    {
        route_ref: 21,
        type: 'tram',
        models: [
            {
                model: models.tram.tatra_t6b5b,
                depot: depots.iskar_tram
            }
        ]
    },
    {
        route_ref: 22,
        type: 'tram',
        models: [
            {
                model: models.tram.tatra_t6a5,
                depot: depots.iskar_tram
            }
        ]
    },
    {
        route_ref: 23,
        type: 'tram',
        models: [
            {
                model: models.tram.duewag_gt8,
                depot: depots.iskar_tram
            }
        ]
    },
    {
        route_ref: 27,
        type: 'tram',
        models: [
            {
                model: models.tram.pesa_swing,
                depot: depots.krasna_polyana
            }
        ]
    },
    {
        route_ref: 1,
        type: 'trolley',
        models: [
            {
                model: models.trolley.skoda_27tr_4,
                depot: depots.nadezhda
            }
        ]
    },
    {
        route_ref: 2,
        type: 'trolley',
        models: [
            {
                model: models.trolley.skoda_27tr_3,
                depot: depots.iskar_trolley
            }
        ]
    },
    {
        route_ref: 3,
        type: 'trolley',
        models: [
            {
                model: models.trolley.skoda_26tr,
                depot: depots.iskar_trolley
            }
        ]
    },
    {
        route_ref: 4,
        type: 'trolley',
        models: [
            {
                model: models.trolley.skoda_26tr,
                depot: depots.iskar_trolley
            }
        ]
    },
    {
        route_ref: 5,
        type: 'trolley',
        models: [
            {
                model: models.trolley.skoda_27tr_3,
                depot: depots.iskar_trolley
            }
        ]
    },
    {
        route_ref: 6,
        type: 'trolley',
        models: [
            {
                model: models.trolley.skoda_27tr_3,
                depot: depots.nadezhda
            },
            {
                model: models.trolley.skoda_27tr_4,
                depot: depots.nadezhda
            }
        ]
    },
    {
        route_ref: 7,
        type: 'trolley',
        models: [
            {
                model: models.trolley.skoda_27tr_3,
                depot: depots.nadezhda
            },
            {
                model: models.trolley.skoda_27tr_4,
                depot: depots.nadezhda
            }
        ]
    },
    {
        route_ref: 8,
        type: 'trolley',
        models: [
            {
                model: models.trolley.skoda_26tr,
                depot: depots.iskar_trolley
            }
        ]
    },
    {
        route_ref: 9,
        type: 'trolley',
        models: [
            {
                model: models.trolley.skoda_27tr_3,
                depot: depots.nadezhda
            },
            {
                model: models.trolley.skoda_27tr_4,
                depot: depots.nadezhda
            }
        ]
    },
    {
        route_ref: 11,
        type: 'trolley',
        models: [
            {
                model: models.trolley.skoda_26tr,
                depot: depots.iskar_trolley
            }
        ]
    },
    {
        route_ref: 1,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 3,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 4,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 5,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 6,
        type: 'bus',
        models: [
            {
                model: models.bus.higer_12m,
                depot: depots.iskar_trolley
            }
        ]
    },
    {
        route_ref: 7,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 8,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 9,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_electric,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 'X9',
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 10,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 'X10',
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 11,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 12,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 14,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 18,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 20,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 21,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 22,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 23,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_electric,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 24,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 26,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 27,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 28,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 29,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 30,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 47,
        type: 'bus',
        models: [
            {
                model: models.bus.mb_conecto_lf,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 49,
        type: 'bus',
        models: [
            {
                model: models.bus.mb_intouro,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 54,
        type: 'bus',
        models: [
            {
                model: models.bus.mb_conecto_g,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 58,
        type: 'bus',
        models: [
            {
                model: models.bus.mb_conecto_lf,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 59,
        type: 'bus',
        models: [
            {
                model: models.bus.mb_conecto_lf,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 60,
        type: 'bus',
        models: [
            {
                model: models.bus.higer_12m,
                depot: depots.nadezhda
            }
        ]
    },
    {
        route_ref: 61,
        type: 'bus',
        models: [
            {
                model: models.bus.mb_intouro,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 63,
        type: 'bus',
        models: [
            {
                model: models.bus.mb_intouro,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 64,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 66,
        type: 'bus',
        models: [
            {
                model: models.bus.mb_intouro,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 67,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.druzhba
            },
            {
                model: models.bus.yutong_cng,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 68,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 69,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_cng,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 70,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_cng,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 72,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 73,
        type: 'bus',
        models: [
            {
                model: models.bus.higer_12m,
                depot: depots.iskar_trolley
            },
            {
                model: models.bus.higer_12m,
                depot: depots.nadezhda
            }
        ]
    },
    {
        route_ref: 74,
        type: 'bus',
        models: [
            {
                model: models.bus.higer_12m,
                depot: depots.nadezhda
            }
        ]
    },
    {
        route_ref: 75,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_electric,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 76,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.druzhba
            }
        ]
    },
    // TODO bus 77
    // {
    //     route_ref: 77,
    //     type: 'bus',
    //     models: [
    //         {
    //             model: models.bus.,
    //             depot: depots.zemlyane_bus
    //         }
    //     ]
    // },
    {
        route_ref: 78,
        type: 'bus',
        models: [
            {
                model: models.bus.man_sg262,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 79,
        type: 'bus',
        models: [
            {
                model: models.bus.man_sg262,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 81,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 82,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_electric,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 83,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 84,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 85,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 86,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 88,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 90,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 94,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 98,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 100,
        type: 'bus',
        models: [
            {
                model: models.bus.higer_9m,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 101,
        type: 'bus',
        models: [
            {
                model: models.bus.higer_9m,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 102,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 107,
        type: 'bus',
        models: [
            {
                model: models.bus.karsan_ejest,
                depot: depots.zemlyane_bus
            }
        ]
    },
    // TODO bus 108
    // {
    //     route_ref: 108,
    //     type: 'bus',
    //     models: [
    //         {
    //             model: models.bus.,
    //             depot: depots.zemlyane_bus
    //         }
    //     ]
    // },
    {
        route_ref: 111,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 117,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 118,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 119,
        type: 'bus',
        models: [
            {
                model: models.bus.bmc_procity,
                depot: depots.mtk
            }
        ]
    },
    {
        route_ref: 120,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 123,
        type: 'bus',
        models: [
            {
                model: models.bus.higer_12m,
                depot: depots.iskar_trolley
            }
        ]
    },
    {
        route_ref: 150,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 204,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 213,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 260,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 280,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 285,
        type: 'bus',
        models: [
            {
                model: models.bus.man_sg262,
                depot: depots.malashevtsi
            },
            {
                model: models.bus.man_lions_city_g,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 288,
        type: 'bus',
        models: [
            {
                model: models.bus.higer_12m,
                depot: depots.iskar_trolley
            }
        ]
    },
    {
        route_ref: 304,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 305,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.druzhba
            }
        ]
    },
    // TODO bus 309
    // {
    //     route_ref: 309,
    //     type: 'bus',
    //     models: [
    //         {
    //             model: models.bus.,
    //             depot: depots.
    //         }
    //     ]
    // },
    {
        route_ref: 310,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.malashevtsi
            }
        ]
    },
    {
        route_ref: 314,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 404,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_cng,
                depot: depots.druzhba
            },
            {
                model: models.bus.bmc_procity,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 413,
        type: 'bus',
        models: [
            {
                model: models.bus.man_lions_city_g,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 604,
        type: 'bus',
        models: [
            {
                model: models.bus.yutong_diesel,
                depot: depots.druzhba
            }
        ]
    },
    {
        route_ref: 801,
        type: 'bus',
        models: [
            {
                model: models.bus.karsan_ejest,
                depot: depots.krasno_selo
            }
        ]
    },
    {
        route_ref: 802,
        type: 'bus',
        models: [
            {
                model: models.bus.karsan_ejest,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 803,
        type: 'bus',
        models: [
            {
                model: models.bus.karsan_ejest,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 804,
        type: 'bus',
        models: [
            {
                model: models.bus.karsan_ejest,
                depot: depots.zemlyane_bus
            }
        ]
    },
    {
        route_ref: 805,
        type: 'bus',
        models: [
            {
                model: models.bus.karsan_ejest,
                depot: depots.zemlyane_bus
            }
        ]
    }
];

export function is_vehicle_expected_on_line(vehicle) {
    let  { inv_number } = vehicle;
    const { type, route_ref } = vehicle;
    if(typeof inv_number === 'string') {
        inv_number = parseInt(inv_number.split('/')[0]);
    }
    const line = expected_models_per_line.find(line => 
        line.type === type
        && line.route_ref == route_ref);
    const model = get_vehicle_model(vehicle);
    const depot = get_vehicle_depot(vehicle);
    if(!line || !model && model.id || !depot) {
        return true;
    }
    const is_expected = line.models.some(expected => 
        expected.model.id == model.id
        && expected.depot.id == depot.id);
    return is_expected;
}