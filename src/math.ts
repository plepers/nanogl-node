import { mat3, mat4, vec3, quat } from "gl-matrix";

const M3 : mat3   = mat3.create();

export function decomposeMat4( m4 : mat4, p:vec3, q:quat, s:vec3 ){

    p[0] = m4[12];
    p[1] = m4[13];
    p[2] = m4[14];
  
    s[0] = Math.sqrt( m4[0]*m4[0] + m4[1]*m4[1] + m4[2]*m4[2] );
    s[1] = Math.sqrt( m4[4]*m4[4] + m4[5]*m4[5] + m4[6]*m4[6] );
    s[2] = Math.sqrt( m4[8]*m4[8] + m4[9]*m4[9] + m4[10]*m4[10] );
  
    M3[0] = m4[0] / s[0];
    M3[1] = m4[1] / s[0];
    M3[2] = m4[2] / s[0];
  
    M3[3] = m4[4] / s[1];
    M3[4] = m4[5] / s[1];
    M3[5] = m4[6] / s[1];
  
    M3[6] = m4[8] / s[2];
    M3[7] = m4[9] / s[2];
    M3[8] = m4[10]/ s[2];
  
    quat.fromMat3( q, M3 );

}

