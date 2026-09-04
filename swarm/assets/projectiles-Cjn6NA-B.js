const r=`@group(0) @binding(1) var<uniform> uniforms: Uniforms;\r
@group(0) @binding(2) var<storage, read> unitStats: array<UnitStats>;\r
@group(0) @binding(5) var<storage, read_write> particleUidToIndex: array<u32>;\r
@group(0) @binding(6) var<storage, read_write> attackInfo: array<AttackInfo>;\r
@group(0) @binding(0) var<storage, read_write> arraySizes: ArraySizes;\r
@group(1) @binding(0) var<storage, read> particles: array<Particle>;\r
@group(2) @binding(0) var<storage, read_write> projectiles: array<Projectile>; // #projectiles\r
\r
@compute @workgroup_size(64)\r
fn main(@builtin(global_invocation_id) id: vec3u) {\r
    if (id.x >= arrayLength(&projectiles)) {\r
        return;\r
    }\r
    var p = projectiles[id.x];\r
    let hitDistance = 5.0;\r
    if (p.targetUid < 0) {\r
        return;\r
    }\r
    let targ = particles[particleUidToIndex[p.targetUid]];\r
    let toTarget = targ.pos - p.pos;\r
    let dist = length(toTarget);\r
    if (dist <= hitDistance) {\r
        p.targetUid = -1;\r
\r
        let attackIdx = atomicAdd(&arraySizes.attackInfo, 1u);\r
        if (attackIdx < arrayLength(&attackInfo)) {\r
            var attack = AttackInfo(targ.pos, targ.uid, p.damage);\r
            attackInfo[attackIdx] = attack;\r
        }\r
    } else {\r
        // p.pos += p.speed*uniforms.deltaTime * toTarget/dist;\r
        p.pos += min(dist, p.speed*uniforms.deltaTime) * toTarget/dist;\r
    }\r
    projectiles[id.x] = p;\r
}`;export{r as default};
