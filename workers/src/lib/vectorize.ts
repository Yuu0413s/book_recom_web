export async function vectorSearch(
  vectorize: VectorizeIndex,
  vector: number[],
  topK: number
): Promise<Array<{ id: string; score: number }>> {
  const result = await vectorize.query(vector, {
    topK,
    returnValues: false,
    returnMetadata: 'none',
  });
  return result.matches.map((m) => ({ id: m.id, score: m.score }));
}

export async function upsertVector(
  vectorize: VectorizeIndex,
  id: string,
  values: number[]
): Promise<void> {
  await vectorize.upsert([{ id, values }]);
}
