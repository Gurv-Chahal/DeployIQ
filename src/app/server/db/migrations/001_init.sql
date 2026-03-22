create table if not exists deployment_reports (
    id bigserial primary key,
    created_at timestamptz not null default now(),
    title text not null,
    status text not null default 'draft'
    );
