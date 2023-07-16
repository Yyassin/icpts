import icpts from 'icpts';

export default async function pointToPoint(req, res) {
  res.statusCode = 200;

  await icpts.ready;

  const { source, reference, options } = JSON.parse(req.body);
  const { transform, error } = icpts.pointToPoint(source, reference, options);

  res.json({ transform, error });
}
