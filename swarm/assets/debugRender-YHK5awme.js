const r=`@group(0) @binding(0) var<uniform> uniforms: Uniforms;\r
@group(0) @binding(1) var<storage, read> cellContents: array<u32>;\r
@group(0) @binding(7) var<storage, read_write> arraySizes: ArraySizes;\r
//@group(1) @binding(0) var<storage, read> particles: array<Particle>;\r
\r
struct VertexOutput {\r
    @builtin(position) position: vec4f,\r
    @location(0) uv: vec2f,\r
}\r
\r
@vertex\r
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {\r
    const QUAD = array<vec2f, 6>(\r
        vec2f(-1.0, -1.0),\r
        vec2f(1.0, -1.0),\r
        vec2f(-1.0, 1.0),\r
        vec2f(-1.0, 1.0),\r
        vec2f(1.0, -1.0),\r
        vec2f(1.0, 1.0)\r
    );\r
\r
    var out: VertexOutput;\r
    out.position = vec4f(QUAD[vertexIndex], 0.0, 1.0);\r
    out.uv = QUAD[vertexIndex] * 0.5 + 0.5;\r
    return out;\r
}\r
\r
@fragment\r
fn fragmentMain(in: VertexOutput) -> @location(0) vec4f {\r
    let lineWidth = 1.0;\r
    let canvasSize = uniforms.canvasSize;\r
    let pos = in.uv * canvasSize;\r
    let p = pos % vec2f(uniforms.cellSize);\r
\r
    if (p.x < lineWidth || p.y < lineWidth) {\r
        return vec4f(1.0, 0.0, 0.0, 1.0);\r
    }\r
\r
    let cellIndex = getCellInfo(pos, uniforms).cellIndex;\r
    let pct = 90 * f32(cellContents[cellIndex]) / f32(arraySizes.particles);\r
    // var color = hsv2rgb(vec3f(f32(cellIndex) / 16, 1.0, 1.0));\r
    var color = hsv2rgb(vec3f(pct, 1.0, 1.0));\r
    // color = vec3f(0);\r
    // return vec4f(in.position.xy / canvasSize.xy, 0, .15);\r
    return vec4f(color, .05);\r
}\r
`;export{r as default};
