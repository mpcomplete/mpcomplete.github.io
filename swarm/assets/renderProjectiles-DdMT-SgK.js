const r=`@group(0) @binding(1) var<uniform> uniforms: Uniforms;\r
@group(0) @binding(5) var<storage, read> particleUidToIndex: array<u32>;\r
@group(1) @binding(0) var<storage, read> particles: array<Particle>;\r
@group(2) @binding(0) var<storage, read> projectiles: array<Projectile>;\r
@group(0) @binding(2) var<storage, read> unitStats: array<UnitStats>;\r
@group(0) @binding(7) var<storage, read> arraySizes: ArraySizesRO;\r
\r
struct VertexOutput {\r
    @builtin(position) position: vec4f,\r
    @location(0) color: vec4f,\r
};\r
\r
fn rotation(angle: f32) -> mat2x2f {\r
    let c = cos(angle);\r
    let s = sin(angle);\r
    return mat2x2f(\r
        vec2f(c, s),\r
        vec2f(-s, c)\r
    );\r
}\r
\r
@vertex\r
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {\r
    const QUAD = array<vec2f, 6>(\r
        vec2f(-1.0, -1.0),\r
        vec2f(1.0, -1.0),\r
        vec2f(-1.0, 1.0),\r
        vec2f(-1.0, 1.0),\r
        vec2f(1.0, -1.0),\r
        vec2f(1.0, 1.0)\r
    );\r
    var out: VertexOutput;\r
    if (vertex_index / 6u >= u32(arraySizes.projectiles)) {\r
        return out;\r
    }\r
    let p = projectiles[vertex_index / 6u];\r
    if (p.targetUid < 0) {\r
        return out;\r
    }\r
    let scale = vec2f(2.0, 1.0)*.7;\r
    let offset = QUAD[vertex_index % 6u] * scale;\r
    let targ = particles[particleUidToIndex[u32(p.targetUid)]];\r
    let facing = normalize(targ.pos - p.pos);\r
    let angle = atan2(facing.y, facing.x);\r
    // let pos = p.pos + offset;\r
    let pos = p.pos + rotation(angle)*offset;\r
\r
    out.position = vec4f((pos.xy / uniforms.canvasSize) * 2.0 - 1.0, 0.0, 1.0);\r
    let hue = select(.1, .99, unitStats[targ.unitType].team != 0);\r
    out.color = vec4f(hsv2rgb(vec3f(hue, 1, .6)), 0.7);\r
    return out;\r
}\r
\r
@fragment\r
fn fs_main(in: VertexOutput) -> @location(0) vec4f {\r
    return in.color;\r
}`;export{r as default};
