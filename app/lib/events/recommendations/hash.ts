export function fnv1aHash(value: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export function utcDateBucket(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function deterministicOrderKey(
  studentId: string,
  eventId: string,
  dateBucket: string
): number {
  return fnv1aHash(`${studentId}::${eventId}::${dateBucket}`) / 0x1_0000_0000;
}
