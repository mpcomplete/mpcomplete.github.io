const r=`// 3 phase grid assignment algorithm courtesy of https://lisyarus.github.io/blog/posts/particle-life-simulation-in-browser-using-webgpu.html\r
// phase 1: calculate number of particles in each cell\r
// phase 2: prefix sum to get cell offsets (multistep)\r
// phase 3: assign particles to new indices, sorted by cell\r
// This is phase 1.\r
\r
@group(0) @binding(0) var<uniform> uniforms: Uniforms;\r
@group(0) @binding(1) var<storage, read_write> cellContents: array<atomic<u32>>;\r
@group(0) @binding(3) var<storage, read_write> team1Counts: array<atomic<u32>>;\r
@group(0) @binding(4) var<storage, read_write> team2Counts: array<atomic<u32>>;\r
@group(0) @binding(2) var<storage, read> unitStats: array<UnitStats>;\r
@group(0) @binding(7) var<storage, read_write> arraySizes: ArraySizes;\r
@group(1) @binding(1) var<storage, read> particles: array<Particle>;\r
\r
// phase 1\r
@compute @workgroup_size(64)\r
fn main(@builtin(global_invocation_id) id: vec3u) {\r
    if (id.x >= arrayLength(&particles)) {\r
    // if (id.x >= arraySizes.particles) {\r
        return;\r
    }\r
\r
    let particle = particles[id.x];\r
    let cellIndex = getCellIndex(particle, uniforms);\r
    atomicAdd(&cellContents[cellIndex + 1], 1u);  // +1 to leave cellContents[0] = 0 for prefix sum\r
    if (particle.health <= 0.0) {\r
        return;\r
    }\r
    if (unitStats[particle.unitType].team == 0) {\r
        atomicAdd(&team1Counts[cellIndex], 1u);\r
    } else {\r
        atomicAdd(&team2Counts[cellIndex], 1u);\r
    }\r
}`;export{r as default};
