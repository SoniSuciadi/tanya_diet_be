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
    const login = await this.authService.loginService(loginDto);
    this.wsGateaway.sendToUser({
      userId: login.id,
      event: 'another-device-logged-in',
      message: 'user logged in',
    });
    const { data, refreshToken } = login;
    res.cookie('refresh_token', refreshToken, cookieOption);

    return {
      message: 'login success',
      data,
    };
  }
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const userId = await this.authService.registerService(registerDto);

    return {
      message: 'register success',
      data: {
        userId,
      },
    };
  }

  @Get('refresh-token')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { cookies } = req;
    const refreshToken = cookies.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const user = await this.authService.getUserByRefreshToken(refreshToken);
    if (!user) {
      res.clearCookie('refresh_token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        domain: process.env.COOKIE_DOMAIN,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }
    const { id } = user;
    const data = { accessToken: genAccessToken({ id }) };
    return {
      message: 'refresh token success',
      data,
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
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
      message: 'logout success',
    };
  }

  @Get('user-information')
  async getUserInformation() {
    return {
      message: 'success get user information',
      data: this.user.get(),
    };
  }
  @Post('forgot-password')
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
    @Headers('origin') origin: string,
  ) {
    const user = await this.authService.getUserByEmail(body.email);
    if (!user) {
      throw new UnauthorizedException('Email not found');
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
      message: 'success send email',
    };
  }
  @Patch('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    if (body.password !== body.confirmPassword) {
      throw new UnauthorizedException('Password not match');
    }
    const user = await this.authService.getUserByResetToken(body.token);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    await this.authService.updatePassword(user.id, body.password);
    this.authService.updateResetTokenByUserId('', user.id);
    return {
      message: 'success reset password',
    };
  }
}
