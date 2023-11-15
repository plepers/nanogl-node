
import { mat3, vec3, quat, mat4 } from 'gl-matrix';
import { decomposeMat4 } from './math';


const MAT3 = mat3.create()
const VX = new Float32Array( MAT3.buffer, 0*4, 3 ) as vec3
const VY = new Float32Array( MAT3.buffer, 3*4, 3 ) as vec3
const VZ = new Float32Array( MAT3.buffer, 6*4, 3 ) as vec3
const VUP  = vec3.fromValues( 0, 1, 0 );

/**
 * This class represents a node in a scene graph, and supports nesting.
 *
 * It provides helpers for handling objects transform in 3D space.
 * You can use it to set position, rotation and scale of an object, and compute the corresponding local & world matrix.
 */
export default class Node {
  /**
   * The local position
   * @defaultValue vec3(0, 0, 0)
   */
  readonly position = vec3.create();
  /**
   * The local rotation
   * @defaultValue Identity quaternion
   */
  readonly rotation = quat.create();
  /**
   * The local scale
   * @defaultValue vec3(1, 1, 1)
   */
  readonly scale    = vec3.fromValues(1, 1, 1);

  /**
   * The local transform matrix
   * @defaultValue Identity 4*4 matrix
   */
  readonly _matrix  = mat4.create();
  /**
   * The world transform matrix
   * @defaultValue Identity 4*4 matrix
   */
  readonly _wmatrix = mat4.create();

  /**
   * The world position
   * @defaultValue vec3(0, 0, 0)
   */
  readonly _wposition: vec3;

  /** The parent for this node */
  _parent  : Node|null = null;
  /** The list of children for this node */
  _children: Node[] = [];

  /** Whether the local matrix is invalid or not */
  private _invalidM = true;
  /** Whether the world matrix is invalid or not */
  private _invalidW = true;

  constructor(){
    this._wposition = new Float32Array( this._wmatrix.buffer, 12*4, 3 ) as vec3;
  }




  /**
   * Rotate node around X-axis.
   * @param rad - The rotation angle (in radians)
   */
  rotateX( rad : number ){ quat.rotateX( this.rotation, this.rotation, rad ); this.invalidate(); }
  /**
   * Rotate node around Y-axis.
   * @param rad - The rotation angle (in radians)
   */
  rotateY( rad : number ){ quat.rotateY( this.rotation, this.rotation, rad ); this.invalidate(); }
  /**
   * Rotate node around Z-axis.
   * @param rad - The rotation angle (in radians)
   */
  rotateZ( rad : number ){ quat.rotateZ( this.rotation, this.rotation, rad ); this.invalidate(); }

  /**
   * Set node position on the X-axis.
   * @param v - The value to set
   */
  set x(v:number){ this.position[0] = v; this.invalidate(); }
  /**
   * Set node position on the Y-axis.
   * @param v - The value to set
   */
  set y(v:number){ this.position[1] = v; this.invalidate(); }
  /**
   * Set node position on the Z-axis.
   * @param v - The value to set
   */
  set z(v:number){ this.position[2] = v; this.invalidate(); }

  /**
   * Get node position on the X-axis.
   */
  get x():number{ return this.position[0]; }
  /**
   * Get node position on the Y-axis.
   */
  get y():number{ return this.position[1]; }
  /**
   * Get node position on the Z-axis.
   */
  get z():number{ return this.position[2]; }


  /**
   * Set node scale for all axes.
   * @param s - The scale factor
   */
  setScale( s : number ){
    this.scale[0] =
    this.scale[1] =
    this.scale[2] = s;
    this.invalidate();
  }


  /**
   * Rotate the node to look at target position.
   * @param tgt - The target position to look at
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
   * Set node local transformation matrix.
   * @param m4 - The matrix to set
   */
  setMatrix( m4 : mat4 ){
    mat4.copy( this._matrix, m4 );
    decomposeMat4( m4, this.position, this.rotation, this.scale );
    this._invalidM = false;
    this._invalidW = true;
  }


  /**
   * Add a child to the node.
   * If the child already has a parent, it will be removed : a node can only have one parent.
   * @param child - The node to add as this node's child
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
   * Remove a child from the node's children.
   * @param child - The node to remove from this node's children
   */
  remove( child : Node ){
    const i = this._children.indexOf( child );
    if( i > -1 ){
      this._children.splice( i, 1 );
      child._parent = null;
    }
  }


  /**
   * Invalidate node local matrix and world matrix.
   */
  invalidate(){
    this._invalidM = true;
    this._invalidW = true;
  }


  /**
   * Update node local matrix, if it has been declared invalid.
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
   * Update node world matrix, if it has been declared invalid, and recursively update all children's world matrices.
   * @param skipParents - If true, the node's parent's world matrix will not be checked or updated before updating node world matrix
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


  /**
   * Compute node world matrix. It also computes node's parent's world matrix (if it has been declared invalid) before computing node world matrix.
   * @param skipParents - If true, the node's parent's world matrix will not be computed
   */
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


  /**
   * Know whether the node world matrix is invalid or not. It also checks node's parent's world matrix.
   * @param skipParents - If true, the node's parent's world matrix will not be checked
   */
  _hasInvalidWorldMatrix( skipParents : boolean ) : boolean {
    return this._invalidW || ( !skipParents && this._parent !== null && this._parent._hasInvalidWorldMatrix( false ) );
  }


};