import { BufferGeometry, Material, Mesh } from "three";

/**
 * Defines types used throughout the app
 */

/** Mesh type for refs */
export type MeshNode = Mesh<BufferGeometry, Material | Material[]>;
