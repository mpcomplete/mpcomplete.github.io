const r=`@group(0) @binding(0) var<uniform> uniforms: Uniforms;\r
@group(0) @binding(3) var<storage, read_write> cellContents: array<atomic<u32>>;\r
@group(0) @binding(4) var<storage, read> cellOffset: array<u32>;\r
@group(0) @binding(5) var<storage, read_write> particleUidToIndex: array<u32>;\r
@group(0) @binding(7) var<storage, read_write> arraySizes: ArraySizes;\r
@group(1) @binding(1) var<storage, read> particles: array<Particle>; // #particles\r
@group(1) @binding(2) var<storage, read_write> particlesNext: array<Particle>; // #particles\r
\r
// phase 3\r
@compute @workgroup_size(64)\r
fn main(@builtin(global_invocation_id) id: vec3u) {\r
    // if (id.x >= arraySizes.particles) {\r
    //     particlesNext[id.x] = particles[id.x];\r
    if (id.x >= arrayLength(&particles)) {\r
        return;\r
    }\r
\r
    let particle = particles[id.x];\r
    let cellIndex = getCellIndex(particle, uniforms);\r
    let indexInCell = atomicAdd(&cellContents[cellIndex], 1);\r
    let newParticleIndex = cellOffset[cellIndex] + indexInCell;\r
    particlesNext[newParticleIndex] = particle;\r
    particleUidToIndex[u32(particle.uid)] = newParticleIndex;\r
}`;export{r as default};
