import * as crypto from 'crypto';

export function computeSha256(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function generateSecureKey(prefix = 'doc'): string {
  const random = crypto.randomBytes(24).toString('hex');
  return `${prefix}_${random}`;
}
