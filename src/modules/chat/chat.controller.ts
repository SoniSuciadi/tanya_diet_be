import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatQueryDto, SendMessageDto } from './chat.dto';
import { UserService } from '../user/user.service';
import * as dayjs from 'dayjs';
import { catchError } from 'src/common/utils/catchError'; // Pastikan import catchError

@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private userService: UserService,
  ) {}

  @Get('chat-room')
  async chatRoom(@Query() query: ChatQueryDto) {
    try {
      const data = await this.chatService.chatRoom(query);
      const objResult = {
        totalItems: +data?.[0]?.count,
        page: +query.page,
        perPage: query.rowsPerPage,
        items: data,
      };
      return {
        message: 'Berhasil mengambil data chat room',
        data: objResult,
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat mengambil data chat room');
    }
  }

  @Get('/:id')
  async chatList(@Param('id') id: string, @Query() query: ChatQueryDto) {
    try {
      const data = await this.chatService.chatList(id, query);
      const objResult = {
        totalItems: +data?.[0]?.count,
        page: +query.page,
        perPage: query.rowsPerPage,
        items: data,
      };
      return {
        message: 'Berhasil mengambil daftar chat',
        data: objResult,
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat mengambil daftar chat');
    }
  }

  @Post('send-message/:id')
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Param('id') id: string,
  ) {
    try {
      // Memeriksa apakah session user masih aktif
      if (
        !this.userService.get().sessionEnd ||
        dayjs(this.userService.get().sessionEnd).isBefore(dayjs())
      ) {
        return {
          message: 'Sesi telah berakhir',
        };
      }

      // Mengirim pesan
      const respon = await this.chatService.sendMessage(sendMessageDto, id);

      return {
        message: 'Pesan berhasil dikirim',
        data: {
          sessionId: respon,
        },
      };
    } catch (error) {
      catchError(error, 'Terjadi kesalahan saat mengirim pesan');
    }
  }
}
