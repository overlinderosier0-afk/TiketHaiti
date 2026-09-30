import { Module, Controller, Get, Patch, Body, Req, UseGuards, UnauthorizedException, ConflictException } from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma.service';
import { JwtGuard } from '../auth/auth.module';

class ProfileUpdateDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
}

@Controller('users')
class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get('profile')
  @UseGuards(JwtGuard)
  async profile(@Req() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) throw new UnauthorizedException('Utilisateur introuvable');

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  @Patch('profile')
  @UseGuards(JwtGuard)
  async updateProfile(@Body() dto: ProfileUpdateDto, @Req() req: any) {
    const data: any = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;

    let user;
    try {
      user = await this.prisma.user.update({ where: { id: req.user.sub }, data });
    } catch (e: any) {
      // Email déjà utilisé par un autre compte : 409 plutôt que 500.
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Cet email est déjà utilisé');
      }
      throw e;
    }
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role
    };
  }

  @Get('tickets')
  @UseGuards(JwtGuard)
  async tickets(@Req() req: any) {
    return this.prisma.ticket.findMany({
      where: { userId: req.user.sub },
      include: {
        event: { include: { city: true } },
        order: { select: { id: true, paymentStatus: true, total: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

@Module({ controllers: [UsersController], providers: [PrismaService] })
export class UsersModule {}

