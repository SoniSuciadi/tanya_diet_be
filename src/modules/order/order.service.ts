import { Injectable } from '@nestjs/common';
import { CreatePayment } from './order.dto';
import { DatabaseService } from 'src/common/database/database.service';
import { UserService } from '../user/user.service';
import { PaymentService } from '../payment/payment.service';
import * as dayjs from 'dayjs';
import {
  MidtransWebhookPayload,
  PaymentStatusResponse,
} from '../payment/payment.dto';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class OrderService {
  constructor(
    private databaseService: DatabaseService,
    private userService: UserService,
    private paymentService: PaymentService,
    private wsGateaway: WebsocketGateway,
  ) {}
  async createTransaction(
    createData: CreatePayment,
    origin: string,
  ): Promise<string> {
    const url = await this.databaseService.db.tx<string>(async (t) => {
      const selectedPackage = await t.oneOrNone<{
        id: string;
        name: string;
        price: number;
      }>(
        `SELECT
            id,
            name,
            price
        FROM
            packages
        WHERE
            name = $<packageName>
        `,
        { packageName: createData.packageName },
      );
      const existingaActiveOrder = await t.oneOrNone<{ paymentUrl: string }>(
        `SELECT payment_url AS "paymentUrl"
        FROM orders 
        WHERE user_id = $<userId>
          AND package_id = $<packageId>
          AND amount = $<pacakgeAmount>
          AND payment_status = 'pending'
          AND created_at >= CURRENT_TIMESTAMP - INTERVAL '20 hours';
    `,
        {
          userId: this.userService.get().id,
          packageId: selectedPackage?.id,
          pacakgeAmount: selectedPackage?.price,
        },
      );
      if (existingaActiveOrder) {
        return existingaActiveOrder.paymentUrl;
      }
      const order = await this.databaseService.insertOne<{ id: string }>({
        table: 'orders',
        data: {
          packageId: selectedPackage?.id,
          userId: this.userService.get().id,
          paymentStatus: 'pending',
          amount: selectedPackage?.price,
        },
        transaction: t,
        returning: ['id'],
      });
      const user = await t.oneOrNone<{
        name: string;
        email: string;
        phoneNumber: string;
      }>(
        `SELECT
            name,
            email,
            phone_number AS "phoneNumber"
        FROM
            users
        WHERE
            id = $<userId>
        `,
        { userId: this.userService.get().id },
      );

      const transactionData = {
        transaction_details: {
          order_id: `${order?.id}_${process.env.APP_NAME}`,
          gross_amount: selectedPackage?.price,
        },
        credit_card: {
          secure: true,
        },
        callbacks: {
          finish: origin,
        },
        customer_details: {
          first_name: user?.name,
          last_name: user?.name,
          email: user?.email,
          phone: user?.phoneNumber,
        },
      };
      const chargeResponse =
        await this.paymentService.snap.createTransaction(transactionData);
      await this.databaseService.updateOne({
        table: 'orders',
        data: {
          paymentUrl: chargeResponse.redirect_url,
        },
        where: {
          id: order?.id || '',
        },
        transaction: t,
      });
      return chargeResponse.redirect_url;
    });
    return url;
  }
  async handlePaymentStatus(
    payload: MidtransWebhookPayload,
  ): Promise<PaymentStatusResponse> {
    const { order_id, transaction_status } = payload;

    const orderId = order_id.split('_')[0];
    const order = await this.databaseService.db.oneOrNone<{
      userId: string;
      sessionEnd: string | null;
      session: string | null;
    }>(
      `SELECT
            o.user_id AS "userId",
            p.session,
            u.session_end AS "sessionEnd"
        FROM
            orders o
            LEFT JOIN packages p ON o.package_id = p.id
            LEFT JOIN users u ON u.id=o.user_id
        WHERE o.id = $<orderId>`,
      {
        orderId,
      },
    );

    if (transaction_status === 'settlement') {
      await this.databaseService.db.tx(async (t) => {
        await this.databaseService.updateOne({
          table: 'orders',
          data: {
            paymentStatus: 'settlement',
            paidData: payload,
            paidDate: new Date().toISOString(),
          },
          where: {
            id: orderId,
          },
          transaction: t,
        });

        let newSession = order?.sessionEnd ? dayjs(order?.sessionEnd) : dayjs();

        if (newSession.isBefore(dayjs())) {
          newSession = dayjs();
        }

        if (order?.userId) {
          const [addSessionRaw = 0, unitOfTimeRaw = 'millisecond'] =
            order?.session?.split(' ') ?? [];

          const addSession = Number(addSessionRaw);
          const unitOfTime = unitOfTimeRaw as dayjs.ManipulateType;

          newSession = newSession.add(addSession, unitOfTime);
          await this.databaseService.updateOne({
            table: 'users',
            data: {
              sessionEnd: newSession.toISOString(),
            },
            where: {
              id: order?.userId,
            },
            transaction: t,
          });
          this.wsGateaway.sendToUser({
            userId: order?.userId,
            event: 'payment-success',
            message: 'payment-success event',
          });
        }
      });
      return { message: `Payment for order ${orderId} is successful` };
    } else {
      return { message: `Payment for order ${orderId} is not completed` };
    }
  }
}
