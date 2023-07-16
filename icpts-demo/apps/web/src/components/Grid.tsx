import React from 'react';

/** 2D Cartesian grid with n divisions of size k */

const Grid = ({
  size = 10,
  divisions = 10,
  color1 = 'teal',
  color2 = 'darkgrey',
}) => {
  return (
    <gridHelper args={[size, divisions, color1, color2]}>
      <meshBasicMaterial color="gray" />
    </gridHelper>
  );
};

export default Grid;
