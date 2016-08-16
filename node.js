var math     = require( './math' );

var mat4 = require( 'gl-matrix/src/gl-matrix/mat4' ),
    mat3 = require( 'gl-matrix/src/gl-matrix/mat3' ),
    vec3 = require( 'gl-matrix/src/gl-matrix/vec3' ),
    quat = require( 'gl-matrix/src/gl-matrix/quat' );


var MAT3 = mat3.create(),
    VX   = new Float32Array( MAT3.buffer, 0*4, 3 ),
    VY   = new Float32Array( MAT3.buffer, 3*4, 3 ),
    VZ   = new Float32Array( MAT3.buffer, 6*4, 3 ),
    VUP  = vec3.fromValues( 0, 1, 0 );



function Node(){

  this.position   = vec3.create();
  this.rotation   = quat.create();
  this.scale      = vec3.fromValues(1, 1, 1);

  this._matrix    = mat4.create();
  this._wmatrix   = mat4.create();

  this._wposition = new Float32Array( this._wmatrix.buffer, 12*4, 3 );

  this._parent    = null;
  this._children  = [];

  this._invalidM  = true;
  this._invalidW  = true;

}


Node.prototype = {


  rotateX : function(rad){ quat.rotateX( this.rotation, this.rotation, rad ); this.invalidate(); },
  rotateY : function(rad){ quat.rotateY( this.rotation, this.rotation, rad ); this.invalidate(); },
  rotateZ : function(rad){ quat.rotateZ( this.rotation, this.rotation, rad ); this.invalidate(); },


  set x(v){ this.position[0] = v; this.invalidate(); },
  set y(v){ this.position[1] = v; this.invalidate(); },
  set z(v){ this.position[2] = v; this.invalidate(); },

  get x(){ return this.position[0]; },
  get y(){ return this.position[1]; },
  get z(){ return this.position[2]; },


  setScale : function( s ){
    this.scale[0] =
    this.scale[1] =
    this.scale[2] = s;
    this.invalidate();
  },


  lookAt : function( tgt ) {
    vec3.subtract( VZ, this.position, tgt );
    vec3.normalize( VZ, VZ );
    vec3.cross( VX, VUP, VZ );
    vec3.normalize( VX, VX );
    vec3.cross( VY, VZ, VX );
    quat.fromMat3( this.rotation, MAT3 );
    this.invalidate();
  },


  setMatrix : function( m4 ){
    mat4.copy( this._matrix, m4 );
    math.decomposeMat4( m4, this.position, this.rotation, this.scale );
    this._invalidM = false;
    this._invalidW = true;
  },


  add : function( child ){
    if( this._children.indexOf( child ) === -1 ){
      if( child._parent !== null ){
        child._parent.remove( child );
      }
      this._children.push( child );
      child._parent = this;
    }
  },


  remove : function( child ){
    var i = this._children.indexOf( child );
    if( i > -1 ){
      this._children.splice( i, 1 );
      child._parent = null;
    }
  },


  invalidate : function(){
    this._invalidM = true;
    this._invalidW = true;
  },


  updateMatrix : function(){
    if( this._invalidM ){

      mat4.fromRotationTranslationScale(
        this._matrix,
        this.rotation,
        this.position,
        this.scale
      );

      this._invalidM = false;
    }
  },


  /**
   * update world matrix and descendants.
   */
  updateWorldMatrix : function( skipParents ){
    skipParents = !!skipParents;


    this.updateMatrix();
    var invalidWorldMatrix = this._hasInvalidWorldMatrix( skipParents );
    if( invalidWorldMatrix ) {
      this._computeWorldMatrix( skipParents );
    }

    for (var i = 0; i < this._children.length; i++) {
      var c = this._children[i];
      c._invalidW = c._invalidW || invalidWorldMatrix;
      c.updateWorldMatrix( true );
    }

  },


  _computeWorldMatrix : function( skipParents ){

    var p = this._parent;

    if( p !== null ){
      if( ! skipParents && p._hasInvalidWorldMatrix( false ) ) {
        p.updateMatrix();
        p._computeWorldMatrix( false );
      }
      mat4.multiply( this._wmatrix, p._wmatrix, this._matrix );
    } else {
      mat4.copy( this._wmatrix, this._matrix );
    }

    this._invalidW = false;

  },



  _hasInvalidWorldMatrix : function( skipParents ){
    return this._invalidW || ( !skipParents && this._parent !== null && this._parent._hasInvalidWorldMatrix( false )  );
  },


};


module.exports = Node;