import icpts from 'icpts';

export default async function pointToPlane(req, res) {
  res.statusCode = 200;

  await icpts.ready;

  try {
    const { source, reference, options } = JSON.parse(req.body);
    const { transform, error } = icpts.pointToPlane(source, reference, options);

    res.json({ transform, error });
  } catch (error: unknown) {
    console.error(`Error: ${(error as Error).stack}`);
    res.statusCode = 400;
    res.json({ error: (error as Error).stack });
  }
}
