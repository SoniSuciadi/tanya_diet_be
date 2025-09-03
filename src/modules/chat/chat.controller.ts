import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatQueryDto, SendMessageDto } from './chat.dto';
import { UserService } from '../user/user.service';
import * as dayjs from 'dayjs';

@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private userService: UserService,
  ) {}
  @Get('chat-room')
  async chatRoom(@Query() query: ChatQueryDto) {
    const data = await this.chatService.chatRoom(query);
    const objResult = {
      totalItems: +data?.[0]?.count,
      page: +query.page,
      perPage: query.rowsPerPage,
      items: data,
    };
    return {
      message: 'chatRoom success',
      data: objResult,
    };
  }
  @Get('/:id')
  async chatList(@Param('id') id: string, @Query() query: ChatQueryDto) {
    const data = await this.chatService.chatList(id, query);
    const objResult = {
      totalItems: +data?.[0]?.count,
      page: +query.page,
      perPage: query.rowsPerPage,
      items: data,
    };
    return {
      message: 'chatList success',
      data: objResult,
    };
  }
  @Post('send-message/:id')
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Param('id') id: string,
  ) {
    if (
      !this.userService.get().sessionEnd ||
      dayjs(this.userService.get().sessionEnd).isBefore(dayjs())
    ) {
      return {
        message: 'session expired',
      };
    }
    const respon = await this.chatService.sendMessage(sendMessageDto, id);

    return {
      message: 'send-message success',
      data: {
        sessionId: respon,
      },
    };
  }
}
