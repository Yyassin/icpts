# icp-ts
> A Typescript implementation of the iterative closest point algorithm using both the point-to-point and point-to-plane variants. An example of usage is shown in the provided React Three Fiber demo, and can be visited [here]();

# Installation
- Simply install the npm package with the command below
```bash
$ npm install icpts
```

# Usage
First import the package.

```typescript
import icpts from "icpts"
```

We expose both ICP strategies using seperate functions under the names `icpts.pointToPlane` and `icpts.pointToPoint`. Both strategies have identical interfaces. We expect the points from two point clouds, a source and a reference, to be provided using flat arrays (`[x, y, z][]`). Additional options are exposed to provide an error tolerance for early stopping, a maximum iteration count and an initial source pose transform. 

Each strategy returns the optimal transform from the source cloud to the reference, stored in a flat array using column major ordering. The final error is also returned. Assuming `source` and `reference` are defined:

```typescript
import icpts from "icpts"

const options = {
    initialPose: IDENTITY,
    tolerance: 1e-10,
    maxIterations: 50
};

const { transform, error } = icpts.pointToPoint(source, reference, options); // or icpts.pointToPlane
```

You may refer to more detailed example usage in `icpts-demo` or in the `icpts` tests, specifically [`icpts.test.ts`](https://github.com/Yyassin/icpts/blob/master/icpts/test/icp.test.ts);

# Why does this exist
Good question, it probably shouldn't (and I wouldn't recommend using it for anything half serious). To answer the question though, no one was brave enough to publish an ICP library using JavaScript/TypeScript (for good reason) so we decided why not. We also tried to make it somewhat readable.

# TODO
- [ ] Generalized ICP

# References
- [1] [Point to Plane](https://www.comp.nus.edu.sg/~lowkl/publications/lowk_point-to-plane_icp_techrep.pdf)
- [2] [Point to Point](https://github.com/Yyassin/icpts/blob/master/PAMI-3DLS-1987.pdf)