const r=`@group(0) @binding(1) var<storage, read> input: array<u32>; // #cellOffset\r
@group(0) @binding(2) var<storage, read_write> output: array<u32>; // #cellOffset\r
@group(1) @binding(3) var<uniform> stepSize: u32; // #stepSize, layout: {hasDynamicOffset: true}, binding: {size: 4}\r
\r
// phase 2\r
@compute @workgroup_size(64)\r
fn main(@builtin(global_invocation_id) id: vec3u) {\r
    if (id.x >= arrayLength(&input)) {\r
        return;\r
    }\r
\r
    if (id.x < stepSize) {\r
        output[id.x] = input[id.x];\r
    } else {\r
        output[id.x] = input[id.x - stepSize] + input[id.x];\r
    }\r
}`;export{r as default};
