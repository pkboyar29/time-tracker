let mm: typeof import('music-metadata') | null = null;

export async function getMusicMetadata() {
  if (!mm) {
    mm = await import('music-metadata');
  }
  return mm;
}
