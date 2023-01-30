import { vec3, quat, mat4 } from 'gl-matrix';
/**
 * This is the base class for all 3D objects. It's like a simplified equivalent to Object3D for three.js.
 * @public
 */
export default class Node {
    /**
     * Node's local position.
     * @defaultValue (0, 0, 0)
     */
    readonly position: vec3;
    /**
     * Node's local rotation.
     * @defaultValue Identity quaternion
     */
    readonly rotation: quat;
    /**
     * Node's local scale.
     * @defaultValue (1, 1, 1)
     */
    readonly scale: vec3;
    readonly _matrix: mat4;
    readonly _wmatrix: mat4;
    readonly _wposition: vec3;
    _parent: Node | null;
    _children: Node[];
    private _invalidM;
    private _invalidW;
    constructor();
    /**
     * Rotate node around X-axis.
     * @param rad - Rotation angle in radians.
     */
    rotateX(rad: number): void;
    /**
     * Rotate node around Y-axis.
     * @param rad - Rotation angle in radians.
     */
    rotateY(rad: number): void;
    /**
     * Rotate node around Z-axis.
     * @param rad - Rotation angle in radians.
     */
    rotateZ(rad: number): void;
    set x(v: number);
    set y(v: number);
    set z(v: number);
    get x(): number;
    get y(): number;
    get z(): number;
    /**
     * Set node scale for all axis.
     * @param s - Scale factor.
     */
    setScale(s: number): void;
    /**
     * Rotate node to look at target position.
     * @param tgt - Target position to look at.
     */
    lookAt(tgt: vec3): void;
    /**
     * Set node transformation matrix.
     * @param m4 - Matrix to assign to node.
     */
    setMatrix(m4: mat4): void;
    /**
     * Add child to this node. If child already has a parent, it will be removed as a node can only have one parent.
     * @param child - Node to add as this node's child.
     */
    add(child: Node): void;
    /**
     * Remove child from this node's children.
     * @param child - Node to remove from this node's children.
     */
    remove(child: Node): void;
    /**
     * Invalidate this node's local matrix and world matrix.
     */
    invalidate(): void;
    /**
     * Update node's local matrix, if it has been declared invalid.
     */
    updateMatrix(): void;
    /**
     * Update node's world matrix if it has been declared invalid, and recursively update all children's world matrices.
     * @param skipParents - If true, parent's world matrix will not be updated.
     */
    updateWorldMatrix(skipParents?: boolean): void;
    _computeWorldMatrix(skipParents: boolean): void;
    _hasInvalidWorldMatrix(skipParents: boolean): boolean;
}
