uniform float uTime;
uniform float uStage;
uniform float uMorphProgress;
uniform vec3 uColor;
uniform float uEmissiveIntensity;
uniform float uBreathPhase;
varying vec2 vUv;

#define PI 3.14159265359
#define TAU 6.28318530718

float circle(vec2 p, vec2 center, float radius) {
  return abs(length(p - center) - radius);
}

float segment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float seedOfLife(vec2 p, float r) {
  float d = circle(p, vec2(0.0), r);
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0;
    vec2 center = vec2(cos(angle), sin(angle)) * r;
    d = min(d, circle(p, center, r));
  }
  return d;
}

float flowerOfLife(vec2 p, float r) {
  float d = seedOfLife(p, r);
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0;
    vec2 center = vec2(cos(angle), sin(angle)) * r * 2.0;
    d = min(d, circle(p, center, r));
  }
  for (int i = 0; i < 6; i++) {
    float angle = (float(i) + 0.5) * TAU / 6.0;
    vec2 center = vec2(cos(angle), sin(angle)) * r * 1.732;
    d = min(d, circle(p, center, r));
  }
  return d;
}

float metatronsCube(vec2 p, float r) {
  float d = 1000.0;
  vec2 points[13];
  points[0] = vec2(0.0);
  for (int i = 0; i < 6; i++) {
    float angle = float(i) * TAU / 6.0;
    points[i + 1] = vec2(cos(angle), sin(angle)) * r;
    points[i + 7] = vec2(cos(angle), sin(angle)) * r * 2.0;
  }
  for (int i = 0; i < 13; i++) {
    d = min(d, circle(p, points[i], r * 0.3));
  }
  for (int i = 0; i < 13; i++) {
    for (int j = i + 1; j < 13; j++) {
      d = min(d, segment(p, points[i], points[j]));
    }
  }
  return d;
}

float sriYantra(vec2 p, float r) {
  float d = 1000.0;
  for (int layer = 0; layer < 4; layer++) {
    float scale = 1.0 - float(layer) * 0.22;
    float offset = float(layer) * 0.05;
    for (int i = 0; i < 3; i++) {
      float a1 = (float(i) * TAU / 3.0) - PI / 2.0;
      float a2 = (float(i + 1) * TAU / 3.0) - PI / 2.0;
      vec2 p1 = vec2(cos(a1), sin(a1)) * r * scale + vec2(0.0, offset);
      vec2 p2 = vec2(cos(a2), sin(a2)) * r * scale + vec2(0.0, offset);
      d = min(d, segment(p, p1, p2));
    }
    for (int i = 0; i < 3; i++) {
      float a1 = (float(i) * TAU / 3.0) + PI / 2.0;
      float a2 = (float(i + 1) * TAU / 3.0) + PI / 2.0;
      vec2 p1 = vec2(cos(a1), sin(a1)) * r * scale - vec2(0.0, offset);
      vec2 p2 = vec2(cos(a2), sin(a2)) * r * scale - vec2(0.0, offset);
      d = min(d, segment(p, p1, p2));
    }
  }
  d = min(d, length(p) - r * 0.05);
  d = min(d, circle(p, vec2(0.0), r * 0.95));
  d = min(d, circle(p, vec2(0.0), r));
  return d;
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0;
  float outerMask = 1.0 - smoothstep(0.9, 1.0, length(uv));
  float r = 0.35;
  float currentD, nextD;
  int stage = int(uStage);
  if (stage == 0) { currentD = seedOfLife(uv, r); nextD = flowerOfLife(uv, r); }
  else if (stage == 1) { currentD = flowerOfLife(uv, r); nextD = metatronsCube(uv, r); }
  else if (stage == 2) { currentD = metatronsCube(uv, r); nextD = sriYantra(uv, r); }
  else { currentD = sriYantra(uv, r); nextD = sriYantra(uv, r); }
  float d = mix(currentD, nextD, uMorphProgress);
  float lineWidth = 0.008;
  float glowWidth = 0.04;
  float line = 1.0 - smoothstep(0.0, lineWidth, d);
  float glow = 1.0 - smoothstep(lineWidth, glowWidth, d);
  float breath = sin(uBreathPhase * TAU) * 0.5 + 0.5;
  float intensity = uEmissiveIntensity * (0.7 + breath * 0.3);
  vec3 color = uColor * intensity;
  float alpha = (line + glow * 0.4) * outerMask * intensity;
  gl_FragColor = vec4(color, alpha);
}
