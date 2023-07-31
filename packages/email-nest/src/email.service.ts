import { Injectable } from '@nestjs/common';
import { EmailConfig } from './environment.types';
import { InjectEmailConfig } from './module.util';
import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface EmailAttachment {
  path: string;
  contentDisposition: 'inline' | 'attachment';
  cid?: string;
}

@Injectable()
export class EmailService {
  transporter: Transporter<SMTPTransport.SentMessageInfo>;

  constructor(@InjectEmailConfig() private emailConfig: EmailConfig) {
    const {
      host,
      port,
      secure,
      auth: { user, password },
      from,
    } = emailConfig;

    this.transporter = createTransport(
      {
        host,
        port,
        secure,
        auth: {
          user,
          pass: password,
        },
      },
      {
        from: {
          name: from.name,
          address: from.email,
        },
      },
    );
  }

  async send(
    to: string,
    subject: string,
    html: string,
    attachments: EmailAttachment[] = [],
  ) {
    // TODO: what do we do in an event of an error
    await this.transporter.sendMail({
      to,
      subject,
      text: html,
      html,
      attachments,
    });
  }
}
