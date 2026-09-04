const r=`@group(1) @binding(0) var<storage, read> particles: array<Particle>;\r
@group(0) @binding(1) var<uniform> uniforms: Uniforms;\r
@group(0) @binding(2) var<storage, read> unitStats: array<UnitStats>;\r
\r
struct VertexOutput {\r
    @builtin(position) position: vec4f,\r
    @location(0) center: vec2f,\r
    @location(1) color: vec4f,\r
};\r
\r
const QUAD = array<vec2f, 6>(\r
    vec2f(-1.0, -1.0),\r
    vec2f(1.0, -1.0),\r
    vec2f(-1.0, 1.0),\r
    vec2f(-1.0, 1.0),\r
    vec2f(1.0, -1.0),\r
    vec2f(1.0, 1.0)\r
);\r
\r
@vertex\r
fn vs_main(@builtin(vertex_index) id: u32) -> VertexOutput {\r
    let radius = 2.5;\r
    let p = particles[id / 6u];\r
    let offset = QUAD[id % 6u] * radius;\r
    let pos = p.pos + offset;\r
\r
    var out: VertexOutput;\r
    // if (p.health < 0.0) {\r
    //     return out;\r
    // }\r
\r
    out.position = vec4f((pos.xy / uniforms.canvasSize) * 2.0 - 1.0, 0.0, 1.0);\r
    out.center = offset / radius; // -1..1 for circle math\r
    let team = unitStats[i32(p.unitType)].team;\r
    let hue = select(0, select(.5, 0.8, team == 0), p.health > 0);\r
    let life = select(max(0.0, p.cooldown/2.0), 1, p.health > 0);\r
    let a = .9*smoothstep(0.1, 1.0, life);\r
    out.color = vec4f(hsv2rgb(vec3f(hue, 1, .9)), a);\r
    return out;\r
}\r
\r
@fragment\r
fn fs_main(in: VertexOutput) -> @location(0) vec4f {\r
    let canvasSize = uniforms.canvasSize;\r
    let dist = length(in.center);\r
    let alpha = smoothstep(0.7, 0.2, dist); // Soft edge\r
    // var color = hsv2rgb(vec3f(in.ptype*.01, 1, 0.9));\r
    // var color = hsv2rgb(vec3f(in.position.x / canvasSize.x, 1, 0.9));\r
    // var color = vec3f(in.position.xy / canvasSize.xy, 0);\r
\r
    return vec4f(in.color.rgb, in.color.a*alpha);\r
}\r
\r
@vertex\r
fn vertexGlow(@builtin(vertex_index) id : u32) -> VertexOutput {\r
    let radius = 2.5;\r
    let p = particles[id / 6u];\r
    let offset = QUAD[id % 6u] * radius;\r
    let position = p.pos + 12.0 * offset;\r
    let team = unitStats[i32(p.unitType)].team;\r
    let hue = select(0, select(.5, 0.8, team == 0), p.health > 0);\r
    let life = select(max(0.0, p.cooldown/1.0), 1, p.health > 0);\r
    let a = .9*smoothstep(0.1, 1.0, life);\r
    return VertexOutput(\r
        vec4f((position.xy / uniforms.canvasSize) * 2.0 - 1.0, 0.0, 1.0),\r
        offset / radius,\r
        // vec4f((position - camera.center) / camera.extent, 0.0, 1.0),\r
        vec4f(hsv2rgb(vec3f(hue, 1, .9)), a)\r
    );\r
}\r
\r
@fragment\r
fn fragmentGlow(in : VertexOutput) -> @location(0) vec4f {\r
    let l = length(in.center);\r
    let alpha = exp(- 6.0 * l * l) / 64.0;\r
    return in.color * vec4f(1.0, 1.0, 1.0, alpha);\r
}\r
`;export{r as default};
