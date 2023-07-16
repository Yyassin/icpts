import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Perf } from 'r3f-perf';
import { OrbitControls, Stage } from '@react-three/drei';
import Grid from './Grid';
import { parsePCDFile } from 'util/pcdUtil';
import PointCloud from './PointCloud';
import { button, useControls } from 'leva';
import { pointToPlane, pointToPoint } from 'lib/icp';
import { IDENTITY, IDENTITY3JS } from '../constants';

/**
 * Primary Scene
 */
const DemoScene = () => {
  const [running, setRunning] = useState(false);
  const [key, setKey] = useState(0);
  const [transformIdx, setTransformIdx] = useState(-1);
  const [runDirection, setRunDirection] = useState<'forward' | 'reverse'>(
    'forward',
  );

  const [strategy, setStrategy] = useState<
    'PointToPlane' | 'PointToPoint' | ''
  >('');
  const [points, setPoints] = useState([] as number[][]);
  const [matrixSource, setMatrixSource] = useState<THREE.Matrix4>(IDENTITY3JS);
  const [matrixReference, setMatrixReference] =
    useState<THREE.Matrix4>(IDENTITY3JS);

  const transforms = useRef<number[][]>([]);
  const sourcePoints = useRef<number[]>();
  const referencePoints = useRef<number[]>();
  const runIntervalId = useRef<NodeJS.Timeout>();

  const getPoints = async () => {
    const points = await parsePCDFile('./pcd/bun4.pcd');
    setPoints(points);
  };

  const initializeScene = () => {
    const sourceMat = new THREE.Matrix4();
    const referenceMat = new THREE.Matrix4();
    setMatrixSource(sourceMat);
    setMatrixReference(referenceMat);
    getPoints();
  };

  useEffect(() => {
    initializeScene();
  }, []);

  useEffect(() => {
    if (!running) {
      return;
    }
    runIntervalId.current = setInterval(() => {
      let runDir = runDirection;

      if (transformIdx === -1) {
        runDir = 'forward';
      } else if (transformIdx === transforms.current.length - 1) {
        runDir = 'reverse';
      }
      setRunDirection(runDir);

      let transform;
      let idx;
      if (runDir === 'forward') {
        idx = transformIdx + 1;
        transform = new THREE.Matrix4().fromArray(transforms.current[idx]);
      } else {
        transform = new THREE.Matrix4()
          .fromArray(transforms.current[transformIdx])
          .invert();
        idx = transformIdx - 1;
      }

      setMatrixSource(transform);
      setTransformIdx(idx);
    }, 200); // 500 should be bound to slider

    return () => {
      if (runIntervalId.current) {
        clearInterval(runIntervalId.current);
        runIntervalId.current = null;
      }
    };
  }, [running, transformIdx, transforms.current, runDirection]);

  const { maxIterations, tolerance } = useControls(
    'ICP',
    {
      ['Point to Point']: button(
        () => {
          setStrategy('PointToPoint');
        },
        { disabled: strategy === 'PointToPlane' },
      ),
      ['Point to Plane']: button(
        () => {
          setStrategy('PointToPlane');
        },
        { disabled: strategy === 'PointToPoint' },
      ),
      ['Reset']: button(
        () => {
          initializeScene();
          setStrategy('');
          setKey((key + 1) % 2);
          setTransformIdx(-1);
          transforms.current = [];
        },
        { disabled: strategy === '' },
      ),
      ['Next']: button(
        async () => {
          let transform;
          if (transformIdx === transforms.current.length - 1) {
            const strat =
              strategy === 'PointToPlane' ? pointToPlane : pointToPoint;
            const { transform: transform_ } = await strat(
              sourcePoints.current!,
              referencePoints.current!,
              {
                maxIterations: maxIterations as number,
                tolerance: tolerance as number,
                initialPose: IDENTITY,
              },
            );
            transforms.current.push(transform_);
            transform = transform_;
          } else {
            transform = transforms.current[transformIdx + 1];
          }
          setMatrixSource(new THREE.Matrix4().fromArray(transform));
          setTransformIdx(transformIdx + 1);
        },
        { disabled: strategy === '' },
      ),
      ['Previous']: button(
        () => {
          const transform = transforms.current[transformIdx];
          setMatrixSource(new THREE.Matrix4().fromArray(transform).invert());
          setTransformIdx(transformIdx - 1);
        },
        { disabled: transformIdx === -1 },
      ),
      [running ? 'Pause' : 'Play']: button(
        () => {
          setRunning(!running);
        },
        {
          disabled: transformIdx === -1,
        },
      ),
      tolerance: { value: 1e-5, min: 0, max: 1e-5 },
      maxIterations: { value: 1, min: 1, max: 100 },
    },

    [strategy, transformIdx, running],
  );

  const onTransformEnd =
    (type: 'source' | 'reference') => (worldPose: number[]) => {
      if (type === 'source') {
        sourcePoints.current = worldPose;
      } else {
        referencePoints.current = worldPose;
      }
    };

  return (
    <>
      {/* <Perf position="top-left" /> */}
      <OrbitControls makeDefault />
      <Stage
        shadows={{ type: 'contact', opacity: 0.2, blur: 3 }}
        environment="sunset"
        preset="portrait"
        intensity={2}
        key={key.toString()}
      >
        <PointCloud
          points={points}
          color="red"
          pointSize={0.1}
          matrix={matrixSource}
          gizmoOffset={[0, 1, 0]}
          onTransformEnd={onTransformEnd('source')}
        />
        <PointCloud
          points={points}
          color="green"
          pointSize={0.1}
          matrix={matrixReference}
          gizmoOffset={[0, 1, 0]}
          onTransformEnd={onTransformEnd('reference')}
        />
        <Grid size={20} divisions={20} />
      </Stage>
    </>
  );
};

export default DemoScene;
