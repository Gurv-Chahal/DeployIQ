import { NextResponse } from "next/server";
import { getDbPool } from "@/app/server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";



// running a test
export async function GET() {
    try {
        const pool = getDbPool();

        await pool.query(`
      create table if not exists app_db_smoke_test (
        id serial primary key,
        checked_at timestamptz not null default now()
      )
    `);

        const insertResult = await pool.query<{
            id: number;
            checked_at: string;
        }>(`
      insert into app_db_smoke_test default values
      returning id, checked_at
    `);

        const metaResult = await pool.query<{
            server_time: string;
            database_name: string;
            database_user: string;
        }>(`
      select
        now() as server_time,
        current_database() as database_name,
        current_user as database_user
    `);

        return NextResponse.json({
            ok: true,
            database: metaResult.rows[0].database_name,
            user: metaResult.rows[0].database_user,
            serverTime: metaResult.rows[0].server_time,
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
