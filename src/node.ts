import math = require( './math' );
import { mat3, vec3, quat, mat4 } from 'gl-matrix';


const MAT3 = mat3.create(),
      VX:vec3   = <vec3>(new Float32Array( MAT3.buffer, 0*4, 3 )),
      VY:vec3   = <vec3>(new Float32Array( MAT3.buffer, 3*4, 3 )),
      VZ:vec3   = <vec3>(new Float32Array( MAT3.buffer, 6*4, 3 )),
      VUP  = vec3.fromValues( 0, 1, 0 );


class Node {

  position: vec3;
  rotation: quat;
  scale   : vec3;

  _matrix : mat4;
  _wmatrix: mat4;

  _wposition: Float32Array;
  
  _parent: Node|null;
  _children: Node[];

  _invalidM: boolean;
  _invalidW: boolean;

  constructor(){

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




  rotateX( rad : number ){ quat.rotateX( this.rotation, this.rotation, rad ); this.invalidate(); }
  rotateY( rad : number ){ quat.rotateY( this.rotation, this.rotation, rad ); this.invalidate(); }
  rotateZ( rad : number ){ quat.rotateZ( this.rotation, this.rotation, rad ); this.invalidate(); }


  set x(v:number){ this.position[0] = v; this.invalidate(); }
  set y(v:number){ this.position[1] = v; this.invalidate(); }
  set z(v:number){ this.position[2] = v; this.invalidate(); }

  get x():number{ return this.position[0]; }
  get y():number{ return this.position[1]; }
  get z():number{ return this.position[2]; }


  setScale( s : number ){
    this.scale[0] =
    this.scale[1] =
    this.scale[2] = s;
    this.invalidate();
  }


  lookAt( tgt : vec3 ) {
    vec3.subtract( VZ, this.position, tgt );
    vec3.normalize( VZ, VZ );
    vec3.cross( VX, VUP, VZ );
    vec3.normalize( VX, VX );
    vec3.cross( VY, VZ, VX );
    quat.fromMat3( this.rotation, MAT3 );
    this.invalidate();
  }


  setMatrix( m4 : mat4 ){
    mat4.copy( this._matrix, m4 );
    math.decomposeMat4( m4, this.position, this.rotation, this.scale );
    this._invalidM = false;
    this._invalidW = true;
  }


  add( child : Node ){
    if( this._children.indexOf( child ) === -1 ){
      if( child._parent !== null ){
        child._parent.remove( child );
      }
      this._children.push( child );
      child._parent = this;
    }
  }


  remove( child : Node ){
    const i = this._children.indexOf( child );
    if( i > -1 ){
      this._children.splice( i, 1 );
      child._parent = null;
    }
  }


  invalidate(){
    this._invalidM = true;
    this._invalidW = true;
  }


  updateMatrix(){
    if( this._invalidM ){

      mat4.fromRotationTranslationScale(
        this._matrix,
        this.rotation,
        this.position,
        this.scale
      );

      this._invalidM = false;
    }
  }


  /**
   * update world matrix and descendants.
   */
  updateWorldMatrix( skipParents : boolean ){
    skipParents = !!skipParents;


    this.updateMatrix();
    const invalidWorldMatrix = this._hasInvalidWorldMatrix( skipParents );
    if( invalidWorldMatrix ) {
      this._computeWorldMatrix( skipParents );
    }

    for (var i = 0; i < this._children.length; i++) {
      var c = this._children[i];
      c._invalidW = c._invalidW || invalidWorldMatrix;
      c.updateWorldMatrix( true );
    }

  }


  _computeWorldMatrix( skipParents : boolean ){

    const p = this._parent;

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

  }



  _hasInvalidWorldMatrix( skipParents : boolean ) : boolean {
    return this._invalidW || ( !skipParents && this._parent !== null && this._parent._hasInvalidWorldMatrix( false ) );
  }


};


export = Node;