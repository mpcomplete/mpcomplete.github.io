const r=`@group(0) @binding(1) var<uniform> uniforms: Uniforms;\r
@group(0) @binding(2) var<storage, read> unitStats: array<UnitStats>;\r
@group(0) @binding(5) var<storage, read_write> particleUidToIndex: array<u32>;\r
@group(0) @binding(6) var<storage, read_write> attackInfo: array<AttackInfo>;\r
@group(0) @binding(7) var<storage, read_write> arraySizes: ArraySizes;\r
@group(1) @binding(0) var<storage, read_write> particles: array<Particle>;\r
@group(2) @binding(0) var<storage, read_write> projectiles: array<Projectile>;\r
\r
@compute @workgroup_size(64)\r
fn main(@builtin(global_invocation_id) id: vec3u) {\r
    if (id.x >= arraySizes.particles) {\r
        return;\r
    }\r
    var u = particles[id.x];\r
    if (u.health < 0.0) {\r
        // TODO\r
        return;\r
    }\r
    let unitInfo = unitStats[i32(u.unitType)];\r
    var targ: Particle;\r
    var targetInRange = false;\r
\r
    if (u.targetUid >= 0) {\r
        targ = particles[particleUidToIndex[u.targetUid]];\r
        targetInRange = length(targ.pos - u.pos) < unitInfo.range;\r
    }\r
\r
    if (u.cooldown > 0) {\r
        u.cooldown -= uniforms.deltaTime;\r
    } else if (u.targetUid >= 0 && targetInRange) {\r
        if (unitInfo.projectileSpeed > 0) {\r
            let projectileIdx = atomicAdd(&arraySizes.projectiles, 1u);\r
            if (projectileIdx < arrayLength(&projectiles)) {\r
                projectiles[projectileIdx] = Projectile(u.pos, u.targetUid, unitInfo.damage, unitInfo.projectileSpeed);\r
            }\r
            u.cooldown = unitInfo.cooldown;\r
        } else {\r
            let attackIdx = atomicAdd(&arraySizes.attackInfo, 1u);\r
            if (attackIdx < arrayLength(&attackInfo)) {\r
                attackInfo[attackIdx] = AttackInfo(targ.pos, u.targetUid, unitInfo.damage);\r
            }\r
            u.cooldown = unitInfo.cooldown;\r
        }\r
    }\r
\r
    particles[id.x] = u;\r
}`;export{r as default};
