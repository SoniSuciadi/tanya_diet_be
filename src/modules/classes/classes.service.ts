import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/common/database/database.service';
import { ClassData, ClassDetail, ClassQueries, Material } from './classes.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class ClassesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly userService: UserService,
  ) {}
  async classList(queries: ClassQueries): Promise<ClassData[]> {
    const { order, search, page = 1, orderBy, rowsPerPage } = queries;

    const offset = (page - 1) * rowsPerPage;

    const whereQuery: string[] = [
      `WHERE c.deleted_at IS NULL`,
      `c.status = 'active'`,
      `c.publish_until >= now()`,
    ];
    if (search) {
      whereQuery.push(`(c.title ILIKE '%$<search:value>%' )`);
    }
    if (queries.category && queries.category.toLowerCase() !== 'all') {
      whereQuery.push(`c.category ILIKE $<category>`);
    }
    if (queries.type && queries.type.toLowerCase() !== 'all') {
      whereQuery.push(`c.type ILIKE $<type>`);
    }

    let q = `
        SELECT
            COUNT(*) OVER () AS count,
            c.id,
            c.title,
            c.instructor,
            c.price,
            c.original_price,
            c.duration,
            count(
                CASE WHEN oc.payment_status = 'settlement' THEN
                    oc.id
                END) AS students,
            avg(
                CASE WHEN oc.payment_status = 'settlement' THEN
                    oc.rating
                END) AS rating,
            c.type,
            c.category,
            c.banner
        FROM
            classes c
            LEFT JOIN order_class oc ON c.id = oc.class_id
        ${whereQuery.join(' AND ')}
        GROUP BY
          c.id
        ORDER BY $<orderBy:raw> $<order:raw>
        `;
    q += `LIMIT $<rowsPerPage> OFFSET $<offset>`;

    const data = await this.databaseService.db.manyOrNone<ClassData>(q, {
      offset,
      order,
      orderBy,
      rowsPerPage,
      search,
      category: queries.category,
      type: queries.type,
    });
    return data;
  }
  async getClassById(id: string): Promise<ClassDetail | null> {
    const q = `
    SELECT
        c.id,
        c.title,
        c.instructor,
        c.instructor_bio AS "instructorBio",
        c.price,
        c.original_price,
        c.duration,
        count(
            CASE WHEN oc.payment_status = 'settlement' THEN
                oc.id
            END) AS students,
        avg(
            CASE WHEN oc.payment_status = 'settlement' THEN
                oc.rating
            END) AS rating,
        c.type,
        c.category,
        c.banner,
        CASE WHEN oc.payment_status = 'settlement' ${this?.userService?.get()?.id ? 'AND oc.user_id = $<userId>' : ''}THEN
                true
        END AS "isPurchased",
        c.description,
        c.what_you_will_learn AS "whatYouWillLearn",
        c.schedule,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', cm.id,
                    'title', cm.title,
                    'description', cm.description,
                    'duration', cm.duration,
                    'postTestPassed', ocm.post_test_passed,
                    'preTestPassed', ocm.pre_test_passed
                ) ORDER BY cm.created_at ASC 
            ) FILTER (WHERE cm.id IS NOT NULL),
            NULL
        ) AS "materials"
        FROM
        classes c
        LEFT JOIN order_class oc ON c.id = oc.class_id
        LEFT JOIN course_material cm ON cm.class_id = c.id
        LEFT JOIN order_course_material ocm ON ocm.course_material_id=cm.id AND ocm.order_class_id = oc.id
        WHERE c.id = $<id>
    GROUP BY
        c.id,oc.payment_status,oc.user_id
    `;
    const data = await this.databaseService.db.oneOrNone<ClassDetail>(q, {
      id,
      userId: this?.userService?.get()?.id || '',
    });
    if (!data) return null;

    const materialStatusData = this.generateCourseMaterialStatus(
      data?.materials || [],
      data?.isPurchased || false,
    );
    data.materials = materialStatusData;
    return data;
  }
  generateCourseMaterialStatus(
    materials: Material[],
    isPurchased: boolean,
  ): Material[] {
    let allPrevComplate = true; // true di awal (gak ada materi sebelumnya)
    let playAssigned = false; // biar cuma 1 yang 'Play'

    return materials.map((m, i) => {
      let status: Material['status'];

      if (m.postTestPassed) {
        // sudah selesai posttest => Complate
        status = 'Complate';
      } else {
        // belum selesai posttest
        const paymentLocked = !isPurchased && i >= 1; // paywall dari index 1 ke atas
        const canBePlay = allPrevComplate && !playAssigned && !paymentLocked;

        if (canBePlay) {
          status = 'Play';
          playAssigned = true;
        } else {
          status = 'Locked';
        }
      }

      // update flag untuk materi berikutnya:
      // allPrevComplate tetap true hanya kalau current sudah Complate
      if (status !== 'Complate') {
        allPrevComplate = false;
      }

      return { ...m, status };
    });
  }
  async getCategoryList(): Promise<string[]> {
    const q = `SELECT DISTINCT category FROM classes ORDER BY category ASC`;
    const data = await this.databaseService.db.manyOrNone(q);

    return data.map((d) => d.category);
  }
  async getLiveClassRoom(id: string): Promise<string> {
    const q = `SELECT live_class_room FROM live_sessions WHERE id = $<id>`;
    const data = await this.databaseService.db.oneOrNone(q, {
      id,
    });
    return data?.live_class_room || '';
  }
}
