const depots_data = [
    {
        id: 1,
        type: 'tram',
        name: 'Надежда',
        is_depot_vehicle: (n) => 0 < n && n < 999 || 3000 <= n && n < 3999
    },
    {
        id: 2,
        type: 'tram',
        name: 'Красна поляна',
        is_depot_vehicle: (n) => 2000 < n && n < 2999
    },
    {
        id: 3,
        type: 'tram',
        name: 'Искър',
        is_depot_vehicle: (n) => 4000 <= n && n <= 4999
    },
    {
        id: 4,
        type: ['trolley', 'bus'],
        name: 'Искър',
        is_depot_vehicle: (n, type) => type == 'trolley' && 1000 <= n && n <= 1999 || type == 'bus' && 5000 <= n && n <= 5999
    },
    {
        id: 5,
        type: 'trolley',
        name: 'Надежда',
        is_depot_vehicle: (n) => 2000 <= n && n <= 2999
    },
    {
        id: 6,
        type: 'bus',
        name: 'Земляне',
        is_depot_vehicle: (n) => 1000 <= n && n <= 1999
    },
    {
        id: 7,
        type: 'bus',
        name: 'Малашевци',
        is_depot_vehicle: (n) => 2000 <= n && n <= 2999
    },
    {
        id: 8,
        type: 'bus',
        name: 'Дружба',
        is_depot_vehicle: (n) => 3000 <= n && n <= 3999
    },
    {
        id: 9,
        type: 'bus',
        name: 'МТК',
        is_depot_vehicle: (n) => 7000 <= n && n <= 7999
    }
];