import { mat4, vec3, quat } from "gl-matrix";
declare function decomposeMat4(m4: mat4, p: vec3, q: quat, s: vec3): void;
declare const _default: {
    decomposeMat4: typeof decomposeMat4;
};
export = _default;
