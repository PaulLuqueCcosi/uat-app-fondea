import type { AmountBucketConfig } from './AmountBucketsConfig';

export function formatRangesParam(buckets: AmountBucketConfig[]): string {
  return buckets
    .map((b) => (b.max === null ? `${b.min}+` : `${b.min}-${b.max}`))
    .join(',');
}
