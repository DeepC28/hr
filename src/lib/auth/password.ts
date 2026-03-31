import bcrypt from "bcryptjs";

export async function verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
  // รองรับกรณีเก่า ๆ ที่เป็น plain (ไม่แนะนำ) โดย detect แบบง่าย
  if (!passwordHash) return false;
  const looksHashed = passwordHash.startsWith("$2a$") || passwordHash.startsWith("$2b$") || passwordHash.startsWith("$2y$");
  if (!looksHashed) {
    return plain === passwordHash;
  }
  return bcrypt.compare(plain, passwordHash);
}