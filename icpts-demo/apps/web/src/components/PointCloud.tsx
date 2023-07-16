import { PivotControls } from '@react-three/drei';
import { FlatMat } from 'icpts/dist/src/types';
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { transformPointCloud } from 'util/pcdUtil';

/**
 * Point cloud with transform gizmo
 */

const getPointPositions = (points: THREE.Points) => {
  const localPositionsAttr = points.geometry.attributes[
    'position'
  ] as THREE.BufferAttribute;
  return localPositionsAttr.array as FlatMat<number>;
};

const getPointsInWorld = (points: THREE.Points, mat: THREE.Matrix4 = null) => {
  const worldMat = mat ?? points.matrixWorld;
  const localPositions = getPointPositions(points);
  return transformPointCloud(localPositions, worldMat);
};

const PointCloud = ({
  points,
  color,
  pointSize,
  matrix,
  gizmoOffset,
  onTransformEnd,
}: {
  points: number[][];
  color: THREE.ColorRepresentation;
  pointSize: number;
  matrix: THREE.Matrix4;
  gizmoOffset: [number, number, number];
  onTransformEnd: (worldPose: number[]) => void;
}) => {
  const pointCloud3JS = useRef<THREE.Points>(null);

  const material = useMemo(
    () => new THREE.PointsMaterial({ color, size: pointSize }),
    [color, pointSize],
  );

  const geometry = useMemo(() => {
    const positions = new Float32Array(points.flat());
    const bufferAttribute = new THREE.BufferAttribute(positions, 3);
    return new THREE.BufferGeometry().setAttribute('position', bufferAttribute);
  }, [points]);

  useEffect(() => {
    if (pointCloud3JS.current) {
      pointCloud3JS.current.applyMatrix4(matrix);
      // The point cloud below doesn't get the
      // updated matrix for some reason, so we
      // explcitly multiply to update :(
      const worldPoints = getPointsInWorld(
        pointCloud3JS.current!,
        new THREE.Matrix4()
          .copy(matrix)
          .multiply(pointCloud3JS.current.matrixWorld),
      );
      onTransformEnd(worldPoints);
    }
  }, [pointCloud3JS, matrix, geometry, onTransformEnd]);

  return (
    <PivotControls
      offset={gizmoOffset}
      depthTest={false}
      lineWidth={4}
      axisColors={['#9381ff', '#ff4d6d', '#7ae582']}
      scale={100}
      fixed={true}
      onDragEnd={() => {
        const worldPoints = getPointsInWorld(pointCloud3JS.current!);
        onTransformEnd(worldPoints);
      }}
    >
      <points ref={pointCloud3JS} geometry={geometry} material={material} />
    </PivotControls>
  );
};

export default PointCloud;
