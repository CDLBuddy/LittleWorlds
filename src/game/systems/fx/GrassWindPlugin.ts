// src/game/systems/fx/GrassWindPlugin.ts
import {
  Material,
  MaterialDefines,
  MaterialPluginBase,
  ShaderLanguage,
  UniformBuffer,
  Vector2,
} from '@babylonjs/core';

export type GrassWindOptions = {
  enabled?: boolean;
  windDir?: Vector2;
  amplitude?: number;
  speed?: number;
  frequency?: number;
  maskScale?: number;
  debugForceMask?: boolean;
};

export class GrassWindPlugin extends MaterialPluginBase {
  private _start = performance.now();

  private _enabled = true;
  private _windDir = new Vector2(1, 0);
  private _amplitude = 0.15;
  private _speed = 1.2;
  private _frequency = 0.8;
  private _maskScale = 0.5;
  private _debugForceMask = false;

  constructor(material: Material, opts: GrassWindOptions = {}) {
    super(material, 'GrassWind', 200, { GRASSWIND: false });

    if (typeof opts.enabled === 'boolean') this._enabled = opts.enabled;
    if (opts.windDir) this.windDir = opts.windDir;
    if (typeof opts.amplitude === 'number') this._amplitude = opts.amplitude;
    if (typeof opts.speed === 'number') this._speed = opts.speed;
    if (typeof opts.frequency === 'number') this._frequency = opts.frequency;
    if (typeof opts.maskScale === 'number') this._maskScale = opts.maskScale;
    if (typeof opts.debugForceMask === 'boolean') this._debugForceMask = opts.debugForceMask;

    // Important: actually enable the plugin
    this._enable(true);
  }

  getClassName() {
    return 'GrassWindPlugin';
  }

  // If you ever switch to WebGPU, you’ll need WGSL too.
  isCompatible(shaderLanguage: ShaderLanguage) {
    return shaderLanguage === ShaderLanguage.GLSL;
  }

  prepareDefines(defines: MaterialDefines) {
    defines['GRASSWIND'] = this._enabled;
  }

  // ✅ Correct place to DECLARE uniforms for a plugin (UBO wiring)
  getUniforms() {
    return {
      ubo: [
        { name: 'grassWindTime', size: 1, type: 'float' },
        { name: 'grassWindDir', size: 2, type: 'vec2' },
        { name: 'grassWindAmplitude', size: 1, type: 'float' },
        { name: 'grassWindSpeed', size: 1, type: 'float' },
        { name: 'grassWindFrequency', size: 1, type: 'float' },
        { name: 'grassWindMaskScale', size: 1, type: 'float' },
        { name: 'grassWindDebugForceMask', size: 1, type: 'float' },
      ],
      vertex: `
        #ifdef GRASSWIND
          uniform float grassWindTime;
          uniform vec2  grassWindDir;
          uniform float grassWindAmplitude;
          uniform float grassWindSpeed;
          uniform float grassWindFrequency;
          uniform float grassWindMaskScale;
          uniform float grassWindDebugForceMask;
        #endif
      `,
    };
  }

  bindForSubMesh(uniformBuffer: UniformBuffer): void {
    if (!this._enabled) return;

    const t = (performance.now() - this._start) * 0.001;

    uniformBuffer.updateFloat('grassWindTime', t);
    uniformBuffer.updateFloat2('grassWindDir', this._windDir.x, this._windDir.y);
    uniformBuffer.updateFloat('grassWindAmplitude', this._amplitude);
    uniformBuffer.updateFloat('grassWindSpeed', this._speed);
    uniformBuffer.updateFloat('grassWindFrequency', this._frequency);
    uniformBuffer.updateFloat('grassWindMaskScale', this._maskScale);
    uniformBuffer.updateFloat('grassWindDebugForceMask', this._debugForceMask ? 1 : 0);
  }

  getCustomCode(shaderType: string, shaderLanguage: ShaderLanguage) {
    if (shaderType !== 'vertex' || shaderLanguage !== ShaderLanguage.GLSL) return null;

    return {
      CUSTOM_VERTEX_UPDATE_POSITION: `
        #ifdef GRASSWIND
          float windMask = 1.0;

          #ifdef VERTEXCOLOR
            windMask = clamp(color.r, 0.0, 1.0);
          #else
            windMask = clamp(positionUpdated.y * grassWindMaskScale, 0.0, 1.0);
          #endif

          if (grassWindDebugForceMask > 0.5) {
            windMask = 1.0;
          }

          // Compute world position from updated local position (use unique name to avoid conflicts)
          vec3 grassWorldPos = (world * vec4(positionUpdated, 1.0)).xyz;

          float phase =
              dot(grassWorldPos.xz, grassWindDir) * grassWindFrequency +
              grassWindTime * grassWindSpeed;

          float wobble = sin(phase) * 0.7 + sin(phase * 2.17 + 1.3) * 0.3;

          vec3 bendDir = normalize(vec3(grassWindDir.x, 0.0, grassWindDir.y));
          positionUpdated.xyz += bendDir * (wobble * grassWindAmplitude * windMask);
        #endif
      `,
    };
  }

  set enabled(v: boolean) {
    this._enabled = v;
    this.markAllDefinesAsDirty();
  }
  get enabled() {
    return this._enabled;
  }

  set windDir(v: Vector2) {
    const len = Math.hypot(v.x, v.y) || 1;
    this._windDir.set(v.x / len, v.y / len);
    this.markAllDefinesAsDirty();
  }
  get windDir() {
    return this._windDir;
  }
}
