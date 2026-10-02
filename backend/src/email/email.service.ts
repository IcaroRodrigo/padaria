import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: any = null;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (apiKey) {
      // Dynamic import to avoid ESM issues at module load time
      import('resend').then(({ Resend }) => {
        this.resend = new Resend(apiKey);
      });
    }
  }

  private get from() {
    return this.config.get<string>('RESEND_FROM_EMAIL') ?? 'Começa Bem - Padaria <noreply@granelsystem.com.br>';
  }

  private get appUrl() {
    return this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
  }

  async sendVerificationCode(email: string, codigo: string, nomeEmpresa: string): Promise<void> {
    const subject = `${codigo} — seu código de verificação`;
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="text-align:center;margin-bottom:32px">
          <div style="display:inline-block;background:#4a7c2f;border-radius:12px;padding:12px 20px">
            <span style="color:#fff;font-size:18px;font-weight:700">Começa Bem - Padaria</span>
          </div>
        </div>
        <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a">Confirme seu e-mail</h2>
        <p style="margin:0 0 24px;color:#555;font-size:15px">
          Olá, <strong>${nomeEmpresa}</strong>! Use o código abaixo para concluir seu cadastro.
          Ele é válido por <strong>10 minutos</strong>.
        </p>
        <div style="background:#f5f0e8;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:44px;font-weight:800;letter-spacing:12px;color:#4a7c2f">${codigo}</span>
        </div>
        <p style="color:#888;font-size:13px;margin:0">
          Se você não solicitou este código, ignore este e-mail.
        </p>
      </div>
    `;

    if (this.resend) {
      await this.resend.emails.send({ from: this.from, to: email, subject, html });
    } else {
      this.logger.warn(`[DEV] Código de verificação para ${email}: ${codigo}`);
    }
  }

  async sendPasswordReset(email: string, token: string, nome: string): Promise<void> {
    const link = `${this.appUrl}/redefinir-senha/${token}`;
    const subject = 'Redefinição de senha — Começa Bem - Padaria';
    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="text-align:center;margin-bottom:32px">
          <div style="display:inline-block;background:#4a7c2f;border-radius:12px;padding:12px 20px">
            <span style="color:#fff;font-size:18px;font-weight:700">Começa Bem - Padaria</span>
          </div>
        </div>
        <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a">Redefinição de senha</h2>
        <p style="margin:0 0 24px;color:#555;font-size:15px">
          Olá, <strong>${nome}</strong>! Recebemos uma solicitação para redefinir sua senha.
          O link abaixo é válido por <strong>1 hora</strong>.
        </p>
        <div style="text-align:center;margin-bottom:24px">
          <a href="${link}" style="display:inline-block;background:#4a7c2f;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none">
            Redefinir minha senha
          </a>
        </div>
        <p style="color:#888;font-size:13px;margin:0">
          Se você não solicitou a redefinição, ignore este e-mail — sua senha permanecerá a mesma.
        </p>
      </div>
    `;

    if (this.resend) {
      await this.resend.emails.send({ from: this.from, to: email, subject, html });
    } else {
      this.logger.warn(`[DEV] Link de redefinição para ${email}: ${link}`);
    }
  }
}
