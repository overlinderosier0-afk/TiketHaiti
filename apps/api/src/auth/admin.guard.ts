import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Vérifie que l'utilisateur authentifié a le rôle ADMIN.
 * À combiner avec JwtGuard : @UseGuards(JwtGuard, AdminGuard)
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    if (!req.user) {
      throw new ForbiddenException('Authentification requise');
    }
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
    return true;
  }
}
