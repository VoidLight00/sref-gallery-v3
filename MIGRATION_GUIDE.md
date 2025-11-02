# Supabase 마이그레이션 가이드

## 연결 문제 해결

현재 PostgreSQL 연결에서 "Tenant or user not found" 오류가 발생하고 있습니다.

### Supabase 연결 정보 확인 방법

1. **Supabase 대시보드** 접속: https://app.supabase.com
2. **프로젝트 선택** → **Settings** → **Database**
3. **Connection string** 섹션에서 정확한 연결 정보 확인

### 연결 방법 옵션

#### 옵션 1: Supabase SQL Editor 사용 (권장)

가장 간단한 방법입니다:

1. Supabase 대시보드 → SQL Editor
2. 새 쿼리 생성
3. `database/migrations/001_initial_setup.sql` 파일 내용 복사
4. 실행

#### 옵션 2: psql 직접 연결

Supabase에서 제공하는 정확한 연결 문자열을 사용하세요:

```bash
# Session mode (권장)
psql "postgresql://postgres.woqkzthyqxscamjyhcis:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"

# 또는 개별 파라미터로
PGPASSWORD='[YOUR-PASSWORD]' psql \\
  -h aws-0-ap-northeast-2.pooler.supabase.com \\
  -p 5432 \\
  -U postgres.woqkzthyqxscamjyhcis \\
  -d postgres \\
  -f database/migrations/001_initial_setup.sql
```

**주의**:
- Port는 6543 (Transaction Mode) 또는 5432 (Session Mode)
- 비밀번호는 @ 기호를 포함할 수 있으므로 URL 인코딩 필요

#### 옵션 3: Node.js 스크립트

```javascript
// migration.js
const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: 5432,
  user: 'postgres.woqkzthyqxscamjyhcis',
  password: 'ryu3904128',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    const sql = fs.readFileSync('database/migrations/001_initial_setup.sql', 'utf8');
    await client.query(sql);

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

migrate();
```

실행:
```bash
npm install pg
node migration.js
```

## 마이그레이션 검증

마이그레이션 완료 후 다음 쿼리로 확인:

```sql
-- 생성된 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Extensions 확인
SELECT extname, extversion
FROM pg_extension;

-- Functions 확인
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public';

-- Storage bucket 확인
SELECT id, name, public
FROM storage.buckets;
```

## 트러블슈팅

### "Tenant or user not found" 오류
- 사용자 이름이 `postgres.[PROJECT_ID]` 형식인지 확인
- Supabase 대시보드에서 정확한 연결 정보 재확인
- 비밀번호에 특수문자가 있으면 URL 인코딩 필요

### SSL 관련 오류
- `?sslmode=require` 추가 또는
- Node.js: `ssl: { rejectUnauthorized: false }` 설정

### 권한 오류
- Supabase 프로젝트가 활성화되어 있는지 확인
- 데이터베이스 비밀번호를 재설정 시도
