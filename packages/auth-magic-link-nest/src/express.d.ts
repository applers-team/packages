declare module Express {
  export interface Request {
    userId?: string;
    user?: { id: string } | any;
  }
}
