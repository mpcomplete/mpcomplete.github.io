const e=`@group(0) @binding(0) var<uniform> uniforms: Uniforms;\r
@group(0) @binding(2) var screenSampler: sampler;\r
@group(1) @binding(0) var prevTex: texture_2d<f32>;  // #fadeTex\r
@group(1) @binding(1) var newTex: texture_2d<f32>;  // #screenTex\r
\r
@vertex fn vertexMain(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {\r
  var pos = array<vec2f, 3>(vec2f(-1, -1), vec2f(3, -1), vec2f(-1, 3));\r
  return vec4f(pos[i], 0, 1);\r
}\r
\r
@fragment fn fragmentMain(@builtin(position) pos: vec4f) -> @location(0) vec4f {\r
  let uv = pos.xy / uniforms.canvasSize;\r
  let texel = 1.0 / uniforms.canvasSize;\r
  \r
  // Simple 3x3 box blur on previous frame\r
  var blur = vec4f(0);\r
  for (var x = -1; x <= 1; x++) {\r
    for (var y = -1; y <= 1; y++) {\r
      blur += textureSample(prevTex, screenSampler, uv + vec2f(f32(x), f32(y)) * texel);\r
    }\r
  }\r
  blur /= 9.0;\r
  blur = textureSample(prevTex, screenSampler, uv);\r
  \r
  // Fade the blurred previous frame\r
  let fadeAmount = 0.94; // Lower = faster fade\r
  let faded = blur * fadeAmount - vec4f(1/256.0);\r
  \r
  // Composite new content on top (additive blend)\r
  let newContent = textureSample(newTex, screenSampler, uv);\r
\r
  return max(faded, newContent);\r
//   return faded + newContent;\r
}`;export{e as default};
