const r=`// http://www.jcgt.org/published/0009/03/02/\r
fn pcg3d(vin: vec3u) -> vec3u {\r
    var v = vin * 1664525u + 1013904223u;\r
\r
    v.x += v.y*v.z;\r
    v.y += v.z*v.x;\r
    v.z += v.x*v.y;\r
\r
    v ^= v >> vec3u(16u);\r
\r
    v.x += v.y*v.z;\r
    v.y += v.z*v.x;\r
    v.z += v.x*v.y;\r
\r
    return v;\r
}\r
\r
// https://www.shadertoy.com/view/XlGcRh#\r
fn hash3(uvt: vec3f) -> vec3f {\r
    let hu = pcg3d(vec3u(uvt * vec3f(1.)));  // scale by approximate resolution\r
    return vec3f(hu) * (1.0/f32(0xffffffffu));\r
}\r
\r
fn hash1(i: u32) -> f32 {\r
    return hash3(vec3f(f32(i))).x;\r
}\r
\r
`;export{r as default};
