import { Injectable } from '@nestjs/common';
import { DbTx } from 'src/common/database/database.type';
import {
  ClassOderData,
  LessonDetail,
  Question,
  TestDto,
} from './order-class.dto';
import { DatabaseService } from 'src/common/database/database.service';
import { UserService } from '../user/user.service';
import * as midtransClient from 'midtrans-client';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import {
  MidtransWebhookPayload,
  PaymentStatusResponse,
} from '../payment/payment.dto';

@Injectable()
export class OrderClassService {
  private readonly snap: midtransClient.Snap;

  constructor(
    private databaseService: DatabaseService,
    private userService: UserService,
    private wsGateaway: WebsocketGateway,
  ) {
    this.snap = new midtransClient.Snap({
      isProduction: process.env.MIDTRANS_PRODUCTION === 'TRUE',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    });
  }

  async createOrderClass(classId: string, origin: string): Promise<string> {
    const url = await this.databaseService.db.tx<string>(
      async (tx: DbTx): Promise<string> => {
        const existingaActiveOrder = await tx.oneOrNone<{ paymentUrl: string }>(
          `SELECT payment_url AS "paymentUrl"
        FROM order_class 
        WHERE user_id = $<userId>
        AND class_id = $<classId> 
        AND payment_status = 'pending'
        AND created_at >= CURRENT_TIMESTAMP - INTERVAL '20 hours';
    `,
          {
            userId: this.userService.get().id,
            classId,
          },
        );

        if (existingaActiveOrder) {
          return existingaActiveOrder.paymentUrl;
        }
        const classDetail = await tx.oneOrNone<ClassOderData>(
          `
        SELECT
            c.id,
            c.price,
            c.original_price AS "originalPrice"
        FROM
            classes c
        WHERE c.id = $<classId> AND c.deleted_at IS NULL AND c.status = 'active'
        `,
          {
            classId,
          },
        );
        if (!classDetail) {
          return '';
        }
        const order = await this.databaseService.insertOne<{ id: string }>({
          table: 'order_class',
          data: {
            classId,
            userId: this.userService.get().id,
            paymentStatus: 'pending',
            price: classDetail.price,
            originalPrice: classDetail.originalPrice,
          },
          transaction: tx,
          returning: ['id'],
        });
        const user = await tx.oneOrNone<{
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
            order_id: `${order?.id}_${process.env.APP_NAME}Cls`,
            gross_amount: classDetail.price,
          },
          credit_card: {
            secure: true,
          },
          callbacks: {
            finish: `${origin}/dashboard/class/${classId}`,
          },
          customer_details: {
            first_name: user?.name,
            last_name: user?.name,
            email: user?.email,
            phone: user?.phoneNumber,
          },
        };
        const chargeResponse =
          await this.snap.createTransaction(transactionData);
        await this.databaseService.updateOne({
          table: 'order_class',
          data: {
            paymentUrl: chargeResponse.redirect_url,
          },
          where: {
            id: order?.id || '',
          },
          transaction: tx,
        });
        return chargeResponse.redirect_url;
      },
    );
    return url;
  }
  async handlePaymentStatus(
    payload: MidtransWebhookPayload,
  ): Promise<PaymentStatusResponse> {
    const { order_id, transaction_status } = payload;

    const orderId = order_id.split('_')[0];

    if (transaction_status === 'settlement') {
      await this.databaseService.db.tx(async (t) => {
        const orders = await this.databaseService.updateOne<{
          userId: string;
          classId: string;
        }>({
          table: 'order_class',
          data: {
            paymentStatus: 'settlement',
            paidData: payload,
            paidDate: new Date().toISOString(),
          },
          where: {
            id: orderId,
          },
          transaction: t,
          returning: ['user_id AS "userId"', 'class_id AS "classId"'],
        });

        const order = orders?.[0];
        const courseMaterials = await this.databaseService.db.manyOrNone<{
          id: string;
        }>(
          `select oc.id from course_material oc where class_id =$<classId> ORDER BY created_at ASC`,
          {
            classId: order?.classId,
          },
        );
        await this.databaseService.insertBulk({
          table: 'order_course_material',
          data: courseMaterials.reverse().map((item) => ({
            order_class_id: orderId,
            courseMaterialId: item.id,
          })),
          transaction: t,
        });
        this.wsGateaway.sendToUser({
          userId: order?.userId,
          event: 'payment-class-success',
          message: 'payment-success event',
        });
      });
      return { message: `Payment for class ${orderId} is successful` };
    } else {
      return { message: `Payment for class ${orderId} is not completed` };
    }
  }
  async getLessonId(
    lessonId: string,
    classId: string,
  ): Promise<LessonDetail | null> {
    const data = await this.databaseService.db.oneOrNone<LessonDetail>(
      `
        SELECT
            cm.id,
            cm.title,
            cm.description,
            cm.video_url AS "videoUrl",
            cm.duration,
            cm.key_points AS "keyPoints",
            ocm.video_passed AS "videoComplate",
            ocm.pre_test_passed AS "preTestCompleted",
            ocm.post_test_passed AS "postTestCompleted"
        FROM
            course_material cm
        RIGHT JOIN order_course_material ocm ON cm.id = ocm.course_material_id
        RIGHT JOIN order_class oc ON oc.id = ocm.order_class_id
        WHERE cm.id = $<lessonId> AND oc.class_id = $<classId> AND oc.user_id=$<userId>
        `,
      {
        lessonId,
        classId,
        userId: this.userService.get().id,
      },
    );
    return data;
  }
  async getTest(
    context: 'Pre' | 'Post',
    lessonId: string,
  ): Promise<Question[]> {
    const data = await this.databaseService.db.oneOrNone<{ test: Question[] }>(
      `select ${context.toLocaleLowerCase()}_test as test from course_material cm where cm.id = $<lessonId>`,
      {
        lessonId,
      },
    );
    if (!data?.test) return [];
    return data?.test;
  }
  async updateTestResult(
    classId: string,
    lessonId: string,
    context: 'Pre' | 'Post',
    data: TestDto,
  ) {
    const orderCourseMaterial = await this.databaseService.db.oneOrNone<{
      id: string;
    }>(
      `
        SELECT ocm.id
        FROM
            course_material cm
        RIGHT JOIN order_course_material ocm ON cm.id = ocm.course_material_id
        RIGHT JOIN order_class oc ON oc.id = ocm.order_class_id
        WHERE cm.id = $<lessonId> AND oc.class_id = $<classId> AND oc.user_id=$<userId>
        `,
      {
        lessonId,
        classId,
        userId: this.userService.get().id,
      },
    );
    if (!orderCourseMaterial) return;
    await this.databaseService.updateOne({
      table: 'order_course_material',
      data:
        context === 'Pre'
          ? {
              pre_test_passed: true,
              result_pre_test: JSON.stringify(data.testResult),
            }
          : {
              post_test_passed: data.passed,
              result_post_test: JSON.stringify(data.testResult),
            },
      where: {
        id: orderCourseMaterial?.id,
      },
    });
  }
  async updateVideoStatus(classId: string, lessonId: string) {
    const orderCourseMaterial = await this.databaseService.db.oneOrNone<{
      id: string;
    }>(
      `
        SELECT ocm.id
        FROM
            course_material cm
        RIGHT JOIN order_course_material ocm ON cm.id = ocm.course_material_id
        RIGHT JOIN order_class oc ON oc.id = ocm.order_class_id
        WHERE cm.id = $<lessonId> AND oc.class_id = $<classId> AND oc.user_id=$<userId>
        `,
      {
        lessonId,
        classId,
        userId: this.userService.get().id,
      },
    );
    if (!orderCourseMaterial) return;
    await this.databaseService.updateOne({
      table: 'order_course_material',
      data: {
        video_passed: true,
      },
      where: {
        id: orderCourseMaterial?.id,
      },
    });
  }
}
