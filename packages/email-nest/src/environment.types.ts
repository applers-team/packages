export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    password: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export interface WithEmailConfig {
  email: EmailConfig;
}
