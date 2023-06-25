export type FlatArray<T> = ArrayLike<T> & { slice: (begin: number, end?: number) => FlatArray<T> };
