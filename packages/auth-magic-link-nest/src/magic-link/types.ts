export interface MagicLinkUser {
  email: string;
}

export interface TokenPayload {
  userId: string;
  iat: number;
  exp: number;
  iss: number;
}
