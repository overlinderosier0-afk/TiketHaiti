import { Global, Module, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { IsEmail, IsString, MinLength, Length } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

export class RegisterDto {
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
  @IsString() phone?: string;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header missing');
    }

    try {
      req.user = this.jwt.verify(header.replace('Bearer ', ''));
      return true;
    } catch {
      throw new UnauthorizedException('Token JWT invalide');
    }
  }
}

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new UnauthorizedException('Cet email est déjà utilisé');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        passwordHash,
        phone: dto.phone ?? null,
        role: 'USER'
      }
    });

    return this.token(user);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return this.token(user);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  async getMe(@Req() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');
    return this.publicProfile(user);
  }

  private token(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role
      }
    };
  }

  private publicProfile(user: any) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    };
  }
}

@Global()
@Module({
  imports: [JwtModule],
  controllers: [AuthController],
  providers: [JwtGuard, PrismaService],
  exports: [JwtGuard, JwtModule]
})
export class AuthModule {}

