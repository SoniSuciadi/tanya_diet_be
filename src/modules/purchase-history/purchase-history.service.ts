import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import { UserService } from '../user/user.service';
import { Purchase } from './puchase-history.dto';
import { GetDataQueryDto } from 'src/dto/queriesList.dto';

@Injectable()
export class PurchaseHistoryService {
  constructor(
    private databaseService: DatabaseService,
    private userService: UserService,
  ) {}

  async getSummary() {
    const data = await this.databaseService.db.oneOrNone<{
      total: number;
      orderClass: number;
      order: number;
    }>(
      `
        WITH oc AS (
            SELECT
                user_id,
                sum(price) AS oc_total,
                count(*) AS oc_cnt
            FROM
                order_class
            where user_id=$<userId> AND payment_status ='settlement'
            GROUP BY
                user_id
        ),
        oo AS (
            SELECT
                user_id,
                sum(amount) AS o_total,
                count(*) AS o_cnt
            FROM
                orders
            where user_id=$<userId> AND payment_status ='settlement'
            GROUP BY
                user_id
        )
        SELECT
            sum(coalesce(oc.oc_total, 0) + coalesce(oo.o_total, 0)) AS total,
            sum(coalesce(oc.oc_cnt, 0)) AS "orderClass",
            sum(coalesce(oo.o_cnt, 0)) AS "order"
        FROM
            oc
            FULL OUTER JOIN oo USING (user_id)
        `,
      {
        userId: this.userService.get().id,
      },
    );
    return data;
  }

  async getList(queries: GetDataQueryDto, type?: string) {
    const { page = 1, rowsPerPage } = queries;

    const offset = (page - 1) * rowsPerPage;
    const whereQuery: string[] = [`WHERE x.created_at IS NOT NULL`];

    if (type && type !== 'all') {
      whereQuery.push(`x.type = $<type>`);
    }
    const data = await this.databaseService.db.manyOrNone<Purchase>(
      `
        SELECT
            COUNT(*) OVER () AS count,
            x.id,
            x.title,
            x."refrence",
            x.instructor,
            x.price,
            x."purchaseDate",
            x."status",
            x."description",
            x.features,
            x.created_at AS "createdAt",
            x."paymentUrl"
        FROM (
            SELECT
                o.id,
                p.id AS "refrence",
                'subscription' AS "type",
                p.name AS title,
                '' AS instructor,
                o.amount AS price,
                o.paid_date AS "purchaseDate",
                o.payment_status AS "status",
                '' AS "description",
                coalesce(p.service, '[]'::jsonb) AS features,
                o.created_at,
                o.payment_url AS "paymentUrl"

            FROM
                orders o
            LEFT JOIN packages p ON p.id = o.package_id
        WHERE
            o.deleted_at IS NULL
            AND o.user_id = $<userId>
        UNION ALL
        SELECT
            oc.id,
            c.id AS "refrence",
            'class' AS "type",
            c.title AS title,
            c.instructor AS instructor,
            oc.price AS price,
            oc.paid_date AS "purchaseDate",
            oc.payment_status AS "status",
            c.description AS "description",
            to_jsonb (coalesce(c.what_you_will_learn, ARRAY[]::text[])) AS features,
            oc.created_at,
            oc.payment_url AS "paymentUrl"
        FROM
            order_class oc
            LEFT JOIN classes c ON c.id = oc.class_id
        WHERE
            oc.deleted_at IS NULL
            AND oc.user_id = $<userId>) AS x
        ${whereQuery.join(' AND ')}
        ORDER BY
            x.created_at DESC
        LIMIT $<rowsPerPage>
        OFFSET $<offset>
        `,
      {
        userId: this.userService.get().id,
        type,
        offset,
        rowsPerPage,
      },
    );
    console.log('👻 ~ PurchaseHistoryService ~ getList ~ data:', data);
    return data;
  }
}
