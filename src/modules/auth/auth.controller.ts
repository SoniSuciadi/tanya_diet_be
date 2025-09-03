import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './auth.dto';
import { AuthService } from './auth.service';
import { cookieOption } from 'src/common/utils/cookieOptions';
import { genAccessToken, genResetToken } from 'src/common/helpers/token';
import { UserService } from '../user/user.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { SendEmailService } from '../send-email/send-email.service';
import { catchError } from 'src/common/utils/catchError'; // Pastikan import catchError

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private sendEmailService: SendEmailService,
    private user: UserService,
    private wsGateaway: WebsocketGateway,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const login = await this.authService.loginService(loginDto);
      this.wsGateaway.sendToUser({
        userId: login.id,
        event: 'another-device-logged-in',
        message: 'user logged in',
      });
      const { data, refreshToken } = login;
      res.cookie('refresh_token', refreshToken, cookieOption);

      return {
        message: 'Login berhasil',
        data,
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat login');
    }
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const userId = await this.authService.registerService(registerDto);

      return {
        message: 'Registrasi berhasil',
        data: {
          userId,
        },
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat registrasi');
    }
  }

  @Get('refresh-token')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { cookies } = req;
      const refreshToken = cookies.refresh_token;
      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token tidak ditemukan');
      }
      const user = await this.authService.getUserByRefreshToken(refreshToken);
      if (!user) {
        res.clearCookie('refresh_token', {
          httpOnly: true,
          sameSite: 'lax',
          secure: true,
          domain: process.env.COOKIE_DOMAIN,
        });
        throw new UnauthorizedException('Refresh token tidak valid');
      }
      const { id } = user;
      const data = { accessToken: genAccessToken({ id }) };
      return {
        message: 'Refresh token berhasil',
        data,
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat refresh token');
    }
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const { cookies } = req;
      const refreshToken = cookies.refresh_token;
      await this.authService.clearUserRefreshToken(refreshToken);
      res.clearCookie('refresh_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        domain: process.env.COOKIE_DOMAIN,
      });
      res.clearCookie('refresh_token', cookieOption);
      return {
        message: 'Logout berhasil',
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat logout');
    }
  }

  @Get('user-information')
  async getUserInformation() {
    try {
      return {
        message: 'Berhasil mengambil informasi pengguna',
        data: this.user.get(),
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat mengambil informasi pengguna');
    }
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
    @Headers('origin') origin: string,
  ) {
    try {
      const user = await this.authService.getUserByEmail(body.email);
      if (!user) {
        throw new UnauthorizedException('Email tidak ditemukan');
      }
      const accessToken = genResetToken({
        id: user.id,
      });

      await this.authService.updateResetTokenByUserId(accessToken, user.id);

      await this.sendEmailService.sendPasswordResetEmail(
        body.email,
        origin,
        accessToken,
      );

      return {
        message: 'Email reset password berhasil dikirim',
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat mengirim email reset password');
    }
  }

  @Patch('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    try {
      if (body.password !== body.confirmPassword) {
        throw new UnauthorizedException('Password tidak cocok');
      }
      const user = await this.authService.getUserByResetToken(body.token);
      if (!user) {
        throw new UnauthorizedException('Token tidak valid');
      }

      await this.authService.updatePassword(user.id, body.password);
      this.authService.updateResetTokenByUserId('', user.id);
      return {
        message: 'Password berhasil direset',
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat mereset password');
    }
  }
}
