# icp-ts
> A Typescript implementation of the iterative closest point algorithm using both the point-to-point and point-to-plane variants. An example of usage is shown in the provided React Three Fiber demo; you can visit the demo [here](https://icpts-web.vercel.app/)

## Installation
- Simply install the npm package with the command below
```bash
$ npm install icpts
```

- If you'd like to build from source, pull the repository and navigate to the `icpts` directory. Run `npm i` to install the dependencies, followed by `npm run build` to build the package. The build artifacts will be placed in the `dist` directory, and the project can be used as a local `node` module.  

## Usage
First import the package.

```typescript
import icpts from "icpts"
```

We expose both ICP strategies using seperate functions under the names `icpts.pointToPlane` and `icpts.pointToPoint`. Both strategies have identical interfaces. We expect the points from two point clouds, a source and a reference, to be provided using flat arrays (`[x, y, z][]`). Additional options are exposed to provide an error tolerance for early stopping, a maximum iteration count and an initial source pose transform. 

Each strategy returns the optimal transform from the source cloud to the reference, stored in a flat array using column major ordering. The final error is also returned. Assuming `source` and `reference` are defined:

```typescript
import icpts from "icpts"

const options = {
    initialPose: IDENTITY, // [1, 0, 0, 0, 0, 1, ...]
    tolerance: 1e-10,
    maxIterations: 50
};

const { transform, error } = icpts.pointToPoint(source, reference, options); // or icpts.pointToPlane
```

You may refer to more detailed example usage in `icpts-demo` or in the `icpts` tests, specifically [`icpts.test.ts`](https://github.com/Yyassin/icpts/blob/master/icpts/test/icp.test.ts);

## Local Development
Pull requests, and general improvements / feedback are welcome. To run the project locally, follow the steps below:

- Pull the repository and navigate to the `icpts` directory.
- Run `npm i` to install the dependencies.
- That's pretty much it. To test that everything is working, you can run the primary test with `ts-node ./test/icp.test.ts` (yes, a test framework probably should've been added but we also don't have that many tests yet).

To run the demo site, navigate to the root of the repo and run `pnpm install` to install the dependencies. The site can be launched locally by then running `pnpm dev` and navigating to `localhost:3000`.

## Why does this exist?
Good question, it probably shouldn't (and I wouldn't recommend using it for anything half serious). To answer the question though, no one was brave enough to publish an ICP library using JavaScript/TypeScript (for good reason) so we decided why not? We also tried to make it *somewhat* readable.

## TODO
- [ ] Generalized ICP
- [ ] Consider adding more tests.

## References
- [1] [Point to Plane](https://www.comp.nus.edu.sg/~lowkl/publications/lowk_point-to-plane_icp_techrep.pdf)
- [2] [Point to Point](https://github.com/Yyassin/icpts/blob/master/PAMI-3DLS-1987.pdf)