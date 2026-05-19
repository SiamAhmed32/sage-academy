declare module "jsonwebtoken" {
  export type JwtPayload = Record<string, unknown>;

  export type SignOptions = {
    algorithm?: string;
    expiresIn?: string | number;
  };

  const jwt: {
    sign(
      payload: string | Buffer | object,
      secretOrPrivateKey: string,
      options?: SignOptions
    ): string;
    verify(token: string, secretOrPublicKey: string): string | JwtPayload;
  };

  export default jwt;
}
