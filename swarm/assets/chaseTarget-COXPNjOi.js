const e=`@group(0) @binding(1) var<uniform> uniforms: Uniforms;\r
@group(0) @binding(2) var<storage, read> unitStats: array<UnitStats>;\r
@group(0) @binding(3) var<storage, read> cellOffset: array<u32>;\r
@group(0) @binding(5) var<storage, read_write> particleUidToIndex: array<u32>;\r
@group(0) @binding(7) var<storage, read_write> arraySizes: ArraySizes;\r
@group(1) @binding(0) var<storage, read_write> particles: array<Particle>;\r
@group(0) @binding(4) var<storage, read_write> team1Counts: array<u32>;\r
@group(0) @binding(8) var<storage, read_write> team2Counts: array<u32>;\r
\r
struct CellRange {\r
    lo: vec2i,\r
    hi: vec2i,\r
}\r
\r
fn getCellRange(pos: vec2f, range: f32) -> CellRange {\r
    let cellInfo = getCellInfo(pos, uniforms);\r
    let cellDist = i32(ceil(range / uniforms.cellSize));\r
    // Compute the range of neighbouring cells for iteration.\r
    var cellRange = CellRange(\r
        cellInfo.cellId - vec2i(cellDist),\r
        cellInfo.cellId + vec2i(cellDist)\r
    );\r
    // Guard against grid boundaries.\r
    cellRange.lo = max(cellRange.lo, vec2i(0));\r
    cellRange.hi = min(cellRange.hi, uniforms.numCells - vec2i(1));\r
    return cellRange;\r
}\r
\r
fn randomizeTarget(u: Particle, targetUid: i32, targetPos: vec2f) -> i32 {\r
    let unitInfo = unitStats[u.unitType];\r
    let range2 = unitInfo.range*unitInfo.range;\r
    var numValid = 0;\r
\r
    let cellRange = getCellRange(targetPos, 1);\r
    let numCellsX = uniforms.numCells.x;\r
    var k = 0u;\r
    var candidate = -1;\r
    for (var cellX = cellRange.lo.x; cellX <= cellRange.hi.x; cellX++) {\r
        for (var cellY = cellRange.lo.y; cellY <= cellRange.hi.y; cellY++) {\r
            let cellIndex = cellY * numCellsX + cellX;\r
            for (var j = cellOffset[cellIndex]; j < cellOffset[cellIndex+1]; j++) {\r
                let other = particles[j];\r
                if (unitStats[other.unitType].team == unitInfo.team) {\r
                    continue;\r
                }\r
                // if (other.health < 0.0) {\r
                //     // TODO: shouldn't happen\r
                //     continue;\r
                // }\r
                if (length2(other.pos - u.pos) < range2) {\r
                    numValid++;\r
                    if (candidate < 0 || floor(hash1(u32(u.uid) ^ u32(other.uid)) * f32(numValid)) < 1.0) {\r
                        candidate = other.uid;\r
                    }\r
                }\r
            }\r
        }\r
    }\r
\r
    if (candidate < 0) {\r
        return targetUid;\r
    }\r
    return candidate;\r
\r
    // // var choice = i32(f32(u.uid * numValid) / f32(arrayLength(&particles)));\r
    // var choice = i32(floor(hash1(u32(u.uid)) * f32(numValid)));\r
    // for (var cellX = cellRange.lo.x; cellX <= cellRange.hi.x; cellX++) {\r
    //     for (var cellY = cellRange.lo.y; cellY <= cellRange.hi.y; cellY++) {\r
    //         let cellIndex = cellY * numCellsX + cellX;\r
    //         for (var j = cellOffset[cellIndex]; j < cellOffset[cellIndex+1]; j++) {\r
    //             let other = particles[j];\r
    //             if (unitStats[other.unitType].team == unitInfo.team) {\r
    //                 continue;\r
    //             }\r
    //             // if (other.health < 0.0) {\r
    //             //     // TODO: shouldn't happen\r
    //             //     continue;\r
    //             // }\r
    //             if (length2(other.pos - u.pos) < range2) {\r
    //                 choice--;\r
    //                 if (choice <= 0) {\r
    //                     return other.uid;\r
    //                 }\r
    //             }\r
    //         }\r
    //     }\r
    // }\r
    // return targetUid;\r
}\r
\r
fn chooseTarget(u: Particle) -> i32 {\r
    if (u.targetUid >= 0 && particles[particleUidToIndex[u.targetUid]].health > 0.0) {\r
        return u.targetUid;\r
    }\r
    let unitInfo = unitStats[u.unitType];\r
\r
    var closestDist2 = 1e20;\r
    var closestCell = vec2f(1e20);\r
\r
    let cellRange = getCellRange(u.pos, unitInfo.range);\r
    let numCellsX = uniforms.numCells.x;\r
    for (var cellX = cellRange.lo.x; cellX <= cellRange.hi.x; cellX++) {\r
        for (var cellY = cellRange.lo.y; cellY <= cellRange.hi.y; cellY++) {\r
            let cellIndex = cellY * numCellsX + cellX;\r
            let cellPos = getCellCenter(vec2i(cellX, cellY), uniforms);\r
            let dist2 = length2(cellPos - u.pos);\r
\r
            let targetCounts = select(team1Counts[cellIndex], team2Counts[cellIndex], unitInfo.team == 0);\r
            if (targetCounts > 0 && dist2 < closestDist2) {\r
                closestDist2 = dist2;\r
                closestCell = cellPos;\r
            }\r
        }\r
    }\r
    return randomizeTarget(u, u.targetUid, closestCell);\r
}\r
\r
struct AvoidOthers {\r
    velocity: vec2f,\r
    targetUid: i32,\r
}\r
fn avoidOthers(index: u32, u: Particle) -> AvoidOthers {\r
    var moveV = vec2f(0, 0);\r
    var targetUid = u.targetUid;\r
\r
    let unitInfo = unitStats[u.unitType];\r
    let range2 = unitInfo.range * unitInfo.range;\r
    var dist2ToTarget = 1e20;\r
    if (targetUid >= 0) {\r
        let targ = particles[particleUidToIndex[targetUid]];\r
        if (targ.health > 0.0) {\r
            dist2ToTarget = length2(targ.pos - u.pos);\r
        } else {\r
            targetUid = -1;\r
        }\r
    }\r
\r
    let cellRange = getCellRange(u.pos, 1);\r
    let numCellsX = uniforms.numCells.x;\r
    for (var cellX = cellRange.lo.x; cellX <= cellRange.hi.x; cellX++) {\r
        for (var cellY = cellRange.lo.y; cellY <= cellRange.hi.y; cellY++) {\r
            let cellIndex = cellY * numCellsX + cellX;\r
            for (var j = cellOffset[cellIndex]; j < cellOffset[cellIndex+1]; j++) {\r
                if (j == index) {\r
                    continue;\r
                }\r
                let other = particles[j];\r
                if (other.health < 0.0) {\r
                    // TODO: shouldn't happen\r
                    continue;\r
                }\r
                let sameTeam = unitStats[other.unitType].team == unitInfo.team;\r
                let repelStrength = select(100.0, 20.0, sameTeam);\r
                let repelRadius = select(5.0, 10.0, sameTeam);\r
                let r = u.pos - other.pos;\r
                let d = length(r);\r
                let d2 = length2(r);\r
                if (d2 > 0.0) {\r
                    moveV += repelStrength * max(0.0, 1.0 - d / repelRadius) * r / d;\r
                    // moveV += repelStrength * repelStrength * max(0.0, 1.0 - d2 / (repelRadius*repelRadius)) * r / d2;\r
                }\r
\r
                // If our target is too far away, find one in range.\r
                if (dist2ToTarget > range2 && d2 < range2 && !sameTeam) {\r
                    targetUid = other.uid;\r
                    dist2ToTarget = d2;\r
                }\r
            }\r
        }\r
    }\r
\r
    if (length(moveV) > unitInfo.walkSpeed) {\r
        moveV = moveV*(unitInfo.walkSpeed/length(moveV));\r
    }\r
    if (targetUid != u.targetUid && targetUid >= 0) {\r
        targetUid = randomizeTarget(u, targetUid, particles[particleUidToIndex[targetUid]].pos);\r
    }\r
    return AvoidOthers(moveV, targetUid);\r
}\r
\r
@compute @workgroup_size(64)\r
fn main(@builtin(global_invocation_id) global_id: vec3u) {\r
    let index = global_id.x;\r
    if (index >= arraySizes.particles) {\r
        return;\r
    }\r
    var u = particles[index];\r
    if (u.health < 0.0) {\r
        // TODO\r
        return;\r
    }\r
    let unitInfo = unitStats[i32(u.unitType)];\r
\r
    let rv = avoidOthers(index, u);\r
    u.targetUid = rv.targetUid;\r
    u.targetUid = chooseTarget(u);\r
    var targetPos = vec2f(0);\r
\r
    if (u.targetUid >= 0) {\r
        let targ = particles[particleUidToIndex[u.targetUid]];\r
        targetPos = targ.pos;\r
    } else {\r
        targetPos = select(arraySizes.team1Center, arraySizes.team2Center, unitInfo.team == 0);\r
    }\r
    let toTarget = targetPos - u.pos;\r
    let dist = length(toTarget);\r
\r
    var velocity = vec2f(0.0);\r
    if (dist > .0001 && dist > unitInfo.range*.8) {\r
        velocity = toTarget/dist * unitInfo.walkSpeed;\r
    }\r
    // let speed = length(velocity);\r
    // if (speed > unitInfo.walkSpeed) {\r
    //     velocity = velocity*(unitInfo.walkSpeed/speed);\r
    // }\r
\r
    velocity += rv.velocity;\r
\r
    u.vel = velocity;\r
    u.pos = u.pos + u.vel*uniforms.deltaTime;\r
\r
    particles[index] = u;\r
}`;export{e as default};
