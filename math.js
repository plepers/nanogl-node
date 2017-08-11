
var mat3 = require( 'gl-matrix/src/gl-matrix/mat3' ),
    quat = require( 'gl-matrix/src/gl-matrix/quat' );

var M3   = mat3.create();


function decomposeMat4( m4, p, q, s ){

  p[0] = m4[12];
  p[1] = m4[13];
  p[2] = m4[14];

  var m0, m1, m2, s;

  m0 = m4[0];
  m1 = m4[1];
  m2 = m4[2];
  s[0] = s = Math.sqrt( m0*m0 + m1*m1 + m2*m2 );
  M3[0] = m0 / s;
  M3[1] = m1 / s;
  M3[2] = m2 / s;

  m0 = m4[4];
  m1 = m4[5];
  m2 = m4[6];
  s[1] = s = Math.sqrt( m0*m0 + m1*m1 + m2*m2 );
  M3[3] = m0 / s;
  M3[4] = m1 / s;
  M3[5] = m2 / s;

  m0 = m4[8];
  m1 = m4[9];
  m2 = m4[10];
  s[2] = s = Math.sqrt( m0*m0 + m1*m1 + m2*m2 );
  M3[6] = m0 / s;
  M3[7] = m1 / s;
  M3[8] = m2 / s;

  quat.fromMat3( q, M3 );

}

module.exports = {
  decomposeMat4 : decomposeMat4
};