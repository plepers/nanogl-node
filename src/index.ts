
import { mat3, vec3, quat, mat4 } from 'gl-matrix';
import { decomposeMat4 } from './math';


const MAT3 = mat3.create()
const VX = new Float32Array( MAT3.buffer, 0*4, 3 ) as vec3
const VY = new Float32Array( MAT3.buffer, 3*4, 3 ) as vec3
const VZ = new Float32Array( MAT3.buffer, 6*4, 3 ) as vec3
const VUP  = vec3.fromValues( 0, 1, 0 );

/**
 * This is the base class for all 3D objects. It's like a simplified equivalent to Object3D for Threejs.
 * @public
 */
export default class Node {

  /**
   * Node's local position.
   * @defaultValue (0, 0, 0)
   */
  readonly position = vec3.create();
  /**
   * Node's local rotation.
   * @defaultValue Identity quaternion
   */
  readonly rotation = quat.create();
  /**
   * Node's local scale.
   * @defaultValue (1, 1, 1)
   */
  readonly scale    = vec3.fromValues(1, 1, 1);

  readonly _matrix  = mat4.create();
  readonly _wmatrix = mat4.create();

  readonly _wposition: vec3;
  
  _parent  : Node|null = null;
  _children: Node[] = [];

  private _invalidM = true;
  private _invalidW = true;

  constructor(){
    this._wposition = new Float32Array( this._wmatrix.buffer, 12*4, 3 ) as vec3;
  }




  /**
   * Rotate node around X-axis.
   * @param rad - Rotation angle in radians.
   */
  rotateX( rad : number ){ quat.rotateX( this.rotation, this.rotation, rad ); this.invalidate(); }
  /**
   * Rotate node around Y-axis.
   * @param rad - Rotation angle in radians.
   */
  rotateY( rad : number ){ quat.rotateY( this.rotation, this.rotation, rad ); this.invalidate(); }
  /**
   * Rotate node around Z-axis.
   * @param rad - Rotation angle in radians.
   */
  rotateZ( rad : number ){ quat.rotateZ( this.rotation, this.rotation, rad ); this.invalidate(); }


  set x(v:number){ this.position[0] = v; this.invalidate(); }
  set y(v:number){ this.position[1] = v; this.invalidate(); }
  set z(v:number){ this.position[2] = v; this.invalidate(); }

  get x():number{ return this.position[0]; }
  get y():number{ return this.position[1]; }
  get z():number{ return this.position[2]; }


  /**
   * Set node scale for all axis.
   * @param s - Scale factor.
   */
  setScale( s : number ){
    this.scale[0] =
    this.scale[1] =
    this.scale[2] = s;
    this.invalidate();
  }


  /**
   * Rotate node to look at target position.
   * @param tgt - Target position to look at.
   */
  lookAt( tgt : vec3 ) {
    vec3.subtract( VZ, this.position, tgt );
    vec3.normalize( VZ, VZ );
    vec3.cross( VX, VUP, VZ );
    vec3.normalize( VX, VX );
    vec3.cross( VY, VZ, VX );
    quat.fromMat3( this.rotation, MAT3 );
    this.invalidate();
  }


  /**
   * Set node transformation matrix.
   * @param m4 - Matrix to assign to node.
   */
  setMatrix( m4 : mat4 ){
    mat4.copy( this._matrix, m4 );
    decomposeMat4( m4, this.position, this.rotation, this.scale );
    this._invalidM = false;
    this._invalidW = true;
  }


  /**
   * Add child to this node. If child already has a parent, it will be removed as a node can only have one parent.
   * @param child - Node to add as this node's child.
   */
  add( child : Node ){
    if( this._children.indexOf( child ) === -1 ){
      if( child._parent !== null ){
        child._parent.remove( child );
      }
      this._children.push( child );
      child._parent = this;
    }
  }


  /**
   * Remove child from this node's children.
   * @param child - Node to remove from this node's children.
   */
  remove( child : Node ){
    const i = this._children.indexOf( child );
    if( i > -1 ){
      this._children.splice( i, 1 );
      child._parent = null;
    }
  }


  /**
   * Invalidate this node's local matrix and world matrix.
   */
  invalidate(){
    this._invalidM = true;
    this._invalidW = true;
  }


  /**
   * Update node's local matrix, if it has been declared invalid.
   */
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
   * Update node's world matrix if it has been declared invalid, and recursively update all children's world matrices.
   * @param skipParents - If true, parent's world matrix will not be updated.
   */
  updateWorldMatrix( skipParents : boolean = false ){

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