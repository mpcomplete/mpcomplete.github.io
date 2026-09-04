const r=`@group(0) @binding(1) var<uniform> uniforms: Uniforms;\r
@group(0) @binding(2) var<storage, read> unitStats: array<UnitStats>;\r
@group(0) @binding(3) var<storage, read> cellOffset: array<u32>;\r
@group(0) @binding(5) var<storage, read_write> particleUidToIndex: array<u32>;\r
@group(0) @binding(6) var<storage, read_write> attackInfo: array<AttackInfo>;\r
@group(0) @binding(7) var<storage, read> arraySizes: ArraySizesRO;\r
@group(1) @binding(0) var<storage, read_write> particles: array<Particle>;\r
\r
@compute @workgroup_size(64)\r
fn main(@builtin(global_invocation_id) id: vec3u) {\r
    if (id.x >= arrayLength(&particles)) {\r
    // if (id.x >= arraySizes.particles) {\r
        return;\r
    }\r
    var u = particles[id.x];\r
    let numAttacks = min(arrayLength(&attackInfo), arraySizes.attackInfo);\r
    for (var i = 0u; i < numAttacks; i++) {\r
        if (attackInfo[i].targetUid == u.uid) {\r
            let oldHealth = u.health;\r
            u.health -= attackInfo[i].damage;\r
            if (u.health <= 0 && oldHealth > 0) {\r
                u.cooldown = 2;  // Re-use cooldown for death timer.\r
            }\r
        }\r
    }\r
\r
    if (u.health <= 0) {\r
        u.cooldown -= uniforms.deltaTime;\r
    }\r
\r
    particles[id.x] = u;\r
}`;export{r as default};
