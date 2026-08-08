import { Module, Controller, Get, Patch, Body, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { IsEmail, IsOptional, IsString } from 'class-validator';
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

    const user = await this.prisma.user.update({ where: { id: req.user.sub }, data });
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
      include: { event: true, order: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}

@Module({ controllers: [UsersController], providers: [PrismaService] })
export class UsersModule {}

