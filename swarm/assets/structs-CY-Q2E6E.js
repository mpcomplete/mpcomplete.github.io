const r=`// Note: vecs must be aligned to an 8 byte boundary!\r
\r
struct Uniforms {\r
    frameIndex: f32,\r
    timeMs: f32,\r
    deltaTime: f32,\r
    canvasSize: vec2f,\r
    numCells: vec2i,\r
    cellSize: f32,\r
}\r
\r
struct Particle {\r
    pos: vec2f,\r
    vel: vec2f,\r
    unitType: u32, // index into UnitStats array\r
    health: f32,\r
    targetUid: i32,\r
    uid: i32,\r
    cooldown: f32,\r
}\r
\r
struct UnitStats {\r
    team: f32,\r
    health: f32,\r
    damage: f32,\r
    range: f32,\r
    cooldown: f32,\r
    walkSpeed: f32,\r
    projectileSpeed: f32,  // negative for melee\r
    padding2: f32,\r
}\r
\r
struct CellInfo {\r
    cellId: vec2i,\r
    cellIndex: i32,\r
}\r
\r
// Represents an event like a particle getting struck by a sword.\r
struct AttackInfo {\r
    pos: vec2f,\r
    targetUid: i32,\r
    damage: f32,\r
}\r
\r
struct Projectile {\r
    pos: vec2f,\r
    targetUid: i32,\r
    damage: f32,\r
    speed: f32,\r
}\r
\r
// Size of our dynamic arrays.\r
// TODO: more generic name than ArraySizes?\r
struct ArraySizes {\r
    particles: u32,\r
    attackInfo: atomic<u32>,\r
    projectiles: atomic<u32>,\r
    team1Particles: u32,\r
    team2Particles: u32,\r
    team1Center: vec2f,\r
    team2Center: vec2f,\r
}\r
\r
// Size of our dynamic arrays.\r
struct ArraySizesRO {\r
    particles: u32,\r
    attackInfo: u32,\r
    projectiles: u32,\r
    team1Particles: u32,\r
    team2Particles: u32,\r
    team1Center: vec2f,\r
    team2Center: vec2f,\r
}\r
\r
fn getCellInfo(position: vec2f, uniforms: Uniforms) -> CellInfo {\r
    let cellSize = uniforms.cellSize;\r
    let numCells = vec2i(uniforms.numCells);\r
\r
    let cellId = vec2i(\r
        clamp(i32(floor(position.x / cellSize)), 0, numCells.x - 1),\r
        clamp(i32(floor(position.y / cellSize)), 0, numCells.y - 1)\r
    );\r
    let cellIndex = cellId.y * numCells.x + cellId.x;\r
\r
    return CellInfo(cellId, cellIndex);\r
}\r
\r
fn getCellCenter(cellId: vec2i, uniforms: Uniforms) -> vec2f {\r
    return (vec2f(cellId) + vec2f(0.5)) * uniforms.cellSize;\r
}\r
\r
fn getCellIndex(u: Particle, uniforms: Uniforms) -> i32 {\r
    // Dead particles are sent to the last cell.\r
    return select(\r
        i32(uniforms.numCells.x * uniforms.numCells.y),\r
        getCellInfo(u.pos, uniforms).cellIndex, u.health > 0);\r
}\r
\r
fn length2(r: vec2f) -> f32 {\r
    return dot(r, r);\r
}\r
\r
// http://lolengine.net/blog/2013/07/27/rgb-to-hsv-in-glsl\r
fn hsv2rgb(c: vec3f) -> vec3f {\r
  let k = vec4f(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\r
  let p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);\r
  return c.z * mix(k.xxx, clamp(p - k.xxx, vec3f(0.0), vec3f(1.0)), c.y);\r
}`;export{r as default};
