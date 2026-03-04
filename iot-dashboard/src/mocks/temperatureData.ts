// src/mocks/temperatureData.ts
// Mock temperature readings per node, structured by Building → Floor → Sector
// Temperature in °C from Sensor 2 of each FE node

export interface TempReading {
    node_id: string;
    node_name: string;
    building: string;
    floor: string;
    sector: string;
    temperature: number;   // °C — latest reading from Sensor 2
    read_at: string;    // ISO 8601
}

export interface TempSector {
    sector: string;
    avg_temp: number;
    min_temp: number;
    max_temp: number;
    node_count: number;
    readings: TempReading[];
}

export interface TempFloor {
    floor: string;
    avg_temp: number;
    sectors: TempSector[];
}

export interface TempBuilding {
    building: string;
    avg_temp: number;
    floors: TempFloor[];
}

// Helper: random temp within range
const randTemp = (min: number, max: number): number =>
    Math.round((min + Math.random() * (max - min)) * 10) / 10;

const now = () => new Date().toISOString();

// Raw readings — realistic temp variation per zone
// Server rooms run hot, warehouses fluctuate, offices are stable
const RAW: Omit<TempReading, "read_at">[] = [
    // Block A — L1
    { node_id: "node-0001", node_name: "FE-0001", building: "Block A", floor: "L1", sector: "A-L1-S1", temperature: randTemp(24, 27) },
    { node_id: "node-0002", node_name: "FE-0002", building: "Block A", floor: "L1", sector: "A-L1-S1", temperature: randTemp(24, 27) },
    { node_id: "node-0003", node_name: "FE-0003", building: "Block A", floor: "L1", sector: "A-L1-S1", temperature: randTemp(25, 29) },
    { node_id: "node-0004", node_name: "FE-0004", building: "Block A", floor: "L1", sector: "A-L1-S2", temperature: randTemp(23, 26) },
    { node_id: "node-0005", node_name: "FE-0005", building: "Block A", floor: "L1", sector: "A-L1-S2", temperature: randTemp(23, 26) },
    // Block A — L2
    { node_id: "node-0006", node_name: "FE-0006", building: "Block A", floor: "L2", sector: "A-L2-S1", temperature: randTemp(26, 31) },
    { node_id: "node-0007", node_name: "FE-0007", building: "Block A", floor: "L2", sector: "A-L2-S1", temperature: randTemp(25, 30) },
    { node_id: "node-0008", node_name: "FE-0008", building: "Block A", floor: "L2", sector: "A-L2-S1", temperature: randTemp(25, 30) },
    { node_id: "node-0009", node_name: "FE-0009", building: "Block A", floor: "L2", sector: "A-L2-S2", temperature: randTemp(27, 33) },
    { node_id: "node-0010", node_name: "FE-0010", building: "Block A", floor: "L2", sector: "A-L2-S2", temperature: randTemp(26, 32) },
    // Block A — L3
    { node_id: "node-0011", node_name: "FE-0011", building: "Block A", floor: "L3", sector: "A-L3-S1", temperature: randTemp(24, 28) },
    { node_id: "node-0012", node_name: "FE-0012", building: "Block A", floor: "L3", sector: "A-L3-S1", temperature: randTemp(24, 28) },

    // Block B — L1
    { node_id: "node-0013", node_name: "FE-0013", building: "Block B", floor: "L1", sector: "B-L1-S1", temperature: randTemp(22, 25) },
    { node_id: "node-0014", node_name: "FE-0014", building: "Block B", floor: "L1", sector: "B-L1-S1", temperature: randTemp(22, 25) },
    { node_id: "node-0015", node_name: "FE-0015", building: "Block B", floor: "L1", sector: "B-L1-S2", temperature: randTemp(23, 27) },
    { node_id: "node-0016", node_name: "FE-0016", building: "Block B", floor: "L1", sector: "B-L1-S2", temperature: randTemp(23, 27) },
    // Block B — L2
    { node_id: "node-0017", node_name: "FE-0017", building: "Block B", floor: "L2", sector: "B-L2-S1", temperature: randTemp(28, 35) },
    { node_id: "node-0018", node_name: "FE-0018", building: "Block B", floor: "L2", sector: "B-L2-S1", temperature: randTemp(28, 34) },
    // Block B — L3
    { node_id: "node-0019", node_name: "FE-0019", building: "Block B", floor: "L3", sector: "B-L3-S1", temperature: randTemp(24, 28) },
    { node_id: "node-0020", node_name: "FE-0020", building: "Block B", floor: "L3", sector: "B-L3-S1", temperature: randTemp(25, 30) },
    { node_id: "node-0021", node_name: "FE-0021", building: "Block B", floor: "L3", sector: "B-L3-S2", temperature: randTemp(23, 26) },
    { node_id: "node-0022", node_name: "FE-0022", building: "Block B", floor: "L3", sector: "B-L3-S2", temperature: randTemp(23, 26) },

    // Block C — L1
    { node_id: "node-0023", node_name: "FE-0023", building: "Block C", floor: "L1", sector: "C-L1-S1", temperature: randTemp(22, 25) },
    { node_id: "node-0024", node_name: "FE-0024", building: "Block C", floor: "L1", sector: "C-L1-S1", temperature: randTemp(22, 25) },
    // Block C — L2
    { node_id: "node-0025", node_name: "FE-0025", building: "Block C", floor: "L2", sector: "C-L2-S1", temperature: randTemp(26, 30) },
    { node_id: "node-0026", node_name: "FE-0026", building: "Block C", floor: "L2", sector: "C-L2-S1", temperature: randTemp(25, 29) },
    { node_id: "node-0027", node_name: "FE-0027", building: "Block C", floor: "L2", sector: "C-L2-S2", temperature: randTemp(24, 27) },
    { node_id: "node-0028", node_name: "FE-0028", building: "Block C", floor: "L2", sector: "C-L2-S2", temperature: randTemp(24, 27) },

    // Warehouse D — Z1/Z2/Z3 (no floors — single floor warehouse)
    { node_id: "node-0029", node_name: "FE-0029", building: "Warehouse D", floor: "L1", sector: "WD-Z1", temperature: randTemp(28, 38) },
    { node_id: "node-0030", node_name: "FE-0030", building: "Warehouse D", floor: "L1", sector: "WD-Z1", temperature: randTemp(29, 39) },
    { node_id: "node-0031", node_name: "FE-0031", building: "Warehouse D", floor: "L1", sector: "WD-Z1", temperature: randTemp(30, 40) },
    { node_id: "node-0032", node_name: "FE-0032", building: "Warehouse D", floor: "L1", sector: "WD-Z1", temperature: randTemp(29, 42) },
    { node_id: "node-0033", node_name: "FE-0033", building: "Warehouse D", floor: "L1", sector: "WD-Z2", temperature: randTemp(27, 36) },
    { node_id: "node-0034", node_name: "FE-0034", building: "Warehouse D", floor: "L1", sector: "WD-Z2", temperature: randTemp(27, 35) },
    { node_id: "node-0035", node_name: "FE-0035", building: "Warehouse D", floor: "L1", sector: "WD-Z2", temperature: randTemp(26, 34) },
    { node_id: "node-0036", node_name: "FE-0036", building: "Warehouse D", floor: "L1", sector: "WD-Z3", temperature: randTemp(25, 32) },
    { node_id: "node-0037", node_name: "FE-0037", building: "Warehouse D", floor: "L1", sector: "WD-Z3", temperature: randTemp(25, 32) },
    { node_id: "node-0038", node_name: "FE-0038", building: "Warehouse D", floor: "L1", sector: "WD-Z3", temperature: randTemp(26, 33) },

    // Server Room E — single floor, runs hot
    { node_id: "node-0039", node_name: "FE-0039", building: "Server Room E", floor: "L1", sector: "SR-E-MAIN", temperature: randTemp(35, 42) },
    { node_id: "node-0040", node_name: "FE-0040", building: "Server Room E", floor: "L1", sector: "SR-E-MAIN", temperature: randTemp(36, 44) },
    { node_id: "node-0041", node_name: "FE-0041", building: "Server Room E", floor: "L1", sector: "SR-E-MAIN", temperature: randTemp(37, 45) },
    { node_id: "node-0042", node_name: "FE-0042", building: "Server Room E", floor: "L1", sector: "SR-E-MAIN", temperature: randTemp(35, 43) },
    { node_id: "node-0043", node_name: "FE-0043", building: "Server Room E", floor: "L1", sector: "SR-E-MAIN", temperature: randTemp(38, 46) },
];

// avg helper
const avg = (nums: number[]) =>
    Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;

// Build structured TempBuilding[] from flat readings
export const buildTempHeatmap = (): TempBuilding[] => {
    const readings: TempReading[] = RAW.map((r) => ({ ...r, read_at: now() }));

    const buildingMap = new Map<string, Map<string, Map<string, TempReading[]>>>();

    for (const r of readings) {
        if (!buildingMap.has(r.building)) buildingMap.set(r.building, new Map());
        const floorMap = buildingMap.get(r.building)!;
        if (!floorMap.has(r.floor)) floorMap.set(r.floor, new Map());
        const sectorMap = floorMap.get(r.floor)!;
        if (!sectorMap.has(r.sector)) sectorMap.set(r.sector, []);
        sectorMap.get(r.sector)!.push(r);
    }

    return Array.from(buildingMap.entries()).map(([building, floorMap]) => {
        const floors: TempFloor[] = Array.from(floorMap.entries()).map(([floor, sectorMap]) => {
            const sectors: TempSector[] = Array.from(sectorMap.entries()).map(([sector, nodeReadings]) => {
                const temps = nodeReadings.map((r) => r.temperature);
                return {
                    sector,
                    avg_temp: avg(temps),
                    min_temp: Math.min(...temps),
                    max_temp: Math.max(...temps),
                    node_count: nodeReadings.length,
                    readings: nodeReadings,
                };
            });
            const allTemps = sectors.flatMap((s) => s.readings.map((r) => r.temperature));
            return { floor, avg_temp: avg(allTemps), sectors };
        });

        const allTemps = floors.flatMap((f) => f.sectors.flatMap((s) => s.readings.map((r) => r.temperature)));
        return { building, avg_temp: avg(allTemps), floors };
    });
};

export const MOCK_TEMP_HEATMAP: TempBuilding[] = buildTempHeatmap();