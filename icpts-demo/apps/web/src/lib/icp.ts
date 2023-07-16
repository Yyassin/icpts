type ICPOptions = {
  maxIterations: number;
  tolerance: number;
  initialPose: number[];
};

const icp = async (
  source: number[],
  reference: number[],
  options: ICPOptions,
  strategy: 'point_to_plane' | 'point_to_point',
) => {
  const data = {
    source,
    reference,
    options,
  };

  const response = await fetch(`/api/${strategy}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const { transform, error } = await response.json();
  return { transform, error };
};

const pointToPlane = async (
  source: number[],
  reference: number[],
  options: ICPOptions,
) => {
  return icp(source, reference, options, 'point_to_plane');
};

const pointToPoint = async (
  source: number[],
  reference: number[],
  options: ICPOptions,
) => {
  return icp(source, reference, options, 'point_to_point');
};

export { pointToPlane, pointToPoint };
