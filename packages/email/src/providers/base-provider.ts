/**
 * Base Email Provider Interface
 */

import type { Email, SendResult } from '../types.js';

export abstract class BaseEmailProvider {
  abstract readonly name: string;

  abstract send(email: Email): Promise<SendResult>;

  async sendBulk(emails: Email[]): Promise<SendResult[]> {
    return Promise.all(emails.map(e => this.send(e)));
  }

  abstract verify(): Promise<boolean>;
}
