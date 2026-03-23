import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await db.execute(sql`
      create table if not exists app_db_smoke_test (
        id serial primary key,
        checked_at timestamptz not null default now()
      )
    `);

        const insertResult = await db.execute(sql`
      insert into app_db_smoke_test default values
      returning id, checked_at
    `);

        const metaResult = await db.execute(sql`
      select
        now() as server_time,
        current_database() as database_name,
        current_user as database_user
    `);

        return NextResponse.json({
            ok: true,
            database: metaResult.rows[0]?.database_name,
            user: metaResult.rows[0]?.database_user,
            serverTime: metaResult.rows[0]?.server_time,
            insertedRow: insertResult.rows[0],
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown database error";

        return NextResponse.json(
            {
                ok: false,
                error: message,
            },
            { status: 500 },
        );
    }
}
