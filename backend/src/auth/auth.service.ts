import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SENHA_REGEX = {
  maiuscula: /[A-Z]/,
  minuscula: /[a-z]/,
  numero: /[0-9]/,
  especial: /[^A-Za-z0-9]/,
};

function validarSenha(senha: string): string | null {
  if (senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
  if (!SENHA_REGEX.maiuscula.test(senha)) return 'A senha deve conter pelo menos uma letra maiúscula';
  if (!SENHA_REGEX.minuscula.test(senha)) return 'A senha deve conter pelo menos uma letra minúscula';
  if (!SENHA_REGEX.numero.test(senha)) return 'A senha deve conter pelo menos um número';
  if (!SENHA_REGEX.especial.test(senha)) return 'A senha deve conter pelo menos um caractere especial';
  return null;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  private buildTokens(user: { id: number; email: string; role: string; empresaId: number | null }) {
    const payload = { sub: user.id, email: user.email, role: user.role, empresaId: user.empresaId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '30d',
    });

    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { empresa: { select: { nome: true } } },
    });

    if (!user || !user.active) throw new UnauthorizedException('Credenciais inválidas');

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) throw new UnauthorizedException('Credenciais inválidas');

    const { accessToken, refreshToken } = this.buildTokens(user);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, empresaId: user.empresaId, empresaNome: user.empresa?.nome ?? null },
    };
  }

  // ─── Verificação de e-mail no cadastro ────────────────────────────────────

  async enviarCodigoVerificacao(email: string, nomeEmpresa: string) {
    const emailExistente = await this.prisma.user.findUnique({ where: { email } });
    if (emailExistente) throw new BadRequestException('Este e-mail já está cadastrado');

    // Limpa códigos anteriores para o mesmo e-mail
    await this.prisma.codigoVerificacao.deleteMany({ where: { email } });

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.codigoVerificacao.create({ data: { email, codigo, expiraEm } });

    await this.emailService.sendVerificationCode(email, codigo, nomeEmpresa);

    return { message: 'Código enviado para o e-mail informado.' };
  }

  async register(dto: RegisterDto & { codigoVerificacao: string }) {
    const senhaErro = validarSenha(dto.password);
    if (senhaErro) throw new BadRequestException(senhaErro);

    const registro = await this.prisma.codigoVerificacao.findFirst({
      where: {
        email: dto.email,
        codigo: dto.codigoVerificacao.trim(),
        usado: false,
        expiraEm: { gt: new Date() },
      },
    });

    if (!registro) throw new BadRequestException('Código de verificação inválido ou expirado');

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('E-mail já cadastrado');

    const trialExpiraEm = new Date();
    trialExpiraEm.setDate(trialExpiraEm.getDate() + 15);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      await tx.codigoVerificacao.update({
        where: { id: registro.id },
        data: { usado: true },
      });

      const empresa = await tx.empresa.create({
        data: { nome: dto.nomeEmpresa, email: dto.email, ativo: true, trialExpiraEm },
      });

      const user = await tx.user.create({
        data: {
          name: dto.nome,
          email: dto.email,
          password: hashedPassword,
          role: 'ADMIN',
          active: true,
          empresaId: empresa.id,
        },
        select: { id: true, name: true, email: true, role: true, empresaId: true },
      });

      return { message: 'Empresa criada com sucesso', user };
    });
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.active) throw new UnauthorizedException('Token inválido');

      const { accessToken } = this.buildTokens(user);
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  async getProfile(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, empresaId: true, createdAt: true },
    });
  }

  // ─── Recuperação de senha ─────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { message: 'Se o e-mail estiver cadastrado, você receberá o link de redefinição.' };

    // Invalida tokens anteriores
    await this.prisma.tokenResetSenha.updateMany({
      where: { email, usado: false },
      data: { usado: true },
    });

    const token = randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.tokenResetSenha.create({ data: { token, email, expiresAt } });

    await this.emailService.sendPasswordReset(email, token, user.name);

    return { message: 'Se o e-mail estiver cadastrado, você receberá o link de redefinição.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const senhaErro = validarSenha(newPassword);
    if (senhaErro) throw new BadRequestException(senhaErro);

    const record = await this.prisma.tokenResetSenha.findUnique({ where: { token } });

    if (!record || record.usado || record.expiresAt < new Date()) {
      throw new BadRequestException('Link inválido ou expirado. Solicite um novo.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email: record.email },
        data: { password: hashedPassword },
      }),
      this.prisma.tokenResetSenha.update({
        where: { token },
        data: { usado: true },
      }),
    ]);

    return { message: 'Senha redefinida com sucesso' };
  }

  // ─── Alteração de senha (usuário autenticado) ──────────────────────────────

  async changePassword(userId: number, senhaAtual: string, novaSenha: string) {
    const senhaErro = validarSenha(novaSenha);
    if (senhaErro) throw new BadRequestException(senhaErro);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const valid = await bcrypt.compare(senhaAtual, user.password);
    if (!valid) throw new BadRequestException('Senha atual incorreta');

    const hashed = await bcrypt.hash(novaSenha, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Senha alterada com sucesso' };
  }
}
