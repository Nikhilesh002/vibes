import argon2 from "argon2";

export const createHash = async (password: string) => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3, // 3 iterations
    parallelism: 4,
  });
};

export const compareHash = async (password: string, hash: string) => {
  return await argon2.verify(hash, password);
};
