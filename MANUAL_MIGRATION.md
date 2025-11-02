# 🚀 Supabase 수동 마이그레이션 가이드

## 📝 방법 1: Supabase SQL Editor 사용 (가장 쉬움!)

### 1단계: Supabase 대시보드 접속
1. 브라우저에서 https://app.supabase.com 접속
2. 로그인
3. **sref-gallery-v3** 프로젝트 선택

### 2단계: SQL Editor 열기
1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭

### 3단계: SQL 복사 & 붙여넣기
1. 아래 파일을 열기: `database/migrations/001_initial_setup.sql`
2. **전체 내용을 복사** (Cmd+A, Cmd+C)
3. Supabase SQL Editor에 **붙여넣기** (Cmd+V)
4. **Run** 버튼 클릭 (또는 Cmd+Enter)

### 4단계: 결과 확인
- 성공 메시지가 나타나면 완료!
- 에러가 발생하면 에러 메시지를 확인

---

## 🖥️ 방법 2: 로컬에서 psql 사용

### 필요한 것
- psql 설치됨 (이미 설치되어 있음: `/opt/homebrew/opt/postgresql@16/bin/psql`)
- 정확한 Supabase 연결 정보

### 1단계: Supabase에서 정확한 연결 정보 확인
1. Supabase 대시보드 → **Settings** → **Database**
2. **Connection string** 섹션에서:
   - **Session mode** 선택 (권장)
   - **URI** 형식 복사

### 2단계: 연결 문자열 형식
```
postgresql://postgres.프로젝트ID:[비밀번호]@[호스트]:[포트]/postgres
```

예시:
```
postgresql://postgres.woqkzthyqxscamjyhcis:ryu3904128@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

**주의사항:**
- **Port**: Session mode는 보통 `5432`, Transaction mode는 `6543`
- **비밀번호**: 특수문자가 있으면 URL 인코딩 필요
  - `@` → `%40`
  - `#` → `%23`
  - 등등

### 3단계: psql로 연결 및 실행
```bash
# 방법 A: 연결 문자열 사용
psql "postgresql://postgres.woqkzthyqxscamjyhcis:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" \
  -f database/migrations/001_initial_setup.sql

# 방법 B: 개별 파라미터 사용
PGPASSWORD='[비밀번호]' psql \
  -h aws-0-ap-northeast-2.pooler.supabase.com \
  -p 5432 \
  -U postgres.woqkzthyqxscamjyhcis \
  -d postgres \
  -f database/migrations/001_initial_setup.sql
```

---

## 🔧 방법 3: Node.js 스크립트 사용

### 1단계: 스크립트 생성
파일 생성: `migrate.js`

```javascript
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    host: 'aws-0-ap-northeast-2.pooler.supabase.com',
    port: 5432,  // Session mode
    user: 'postgres.woqkzthyqxscamjyhcis',
    password: 'ryu3904128',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected!');

    const sqlPath = path.join(__dirname, 'database/migrations/001_initial_setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Running migration...');
    await client.query(sql);

    console.log('✅ Migration completed successfully!');

    // 검증
    console.log('\n📊 Verifying tables...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('Created tables:');
    result.rows.forEach(row => console.log(`  - ${row.table_name}`));

  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error.message);
    console.error('\nFull error:', error);
  } finally {
    await client.end();
    console.log('\n👋 Disconnected from database');
  }
}

runMigration();
```

### 2단계: 의존성 설치 및 실행
```bash
# pg 라이브러리 설치
npm install pg

# 마이그레이션 실행
node migrate.js
```

---

## ✅ 마이그레이션 검증

마이그레이션 완료 후 다음 SQL로 확인:

```sql
-- 1. 생성된 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 예상 결과:
-- categories, comments, favorites, likes, sref_codes,
-- sref_images, tags, users

-- 2. Extensions 확인
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pg_trgm');

-- 3. Functions 확인
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 예상 결과:
-- increment_view_count, search_sref_codes, update_comment_count, etc.

-- 4. Storage bucket 확인
SELECT id, name, public
FROM storage.buckets
WHERE id = 'sref-images';

-- 5. RLS 정책 확인
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🚨 트러블슈팅

### "Tenant or user not found"
→ Supabase 대시보드에서 정확한 연결 정보 재확인
→ Port 번호 확인 (5432 vs 6543)

### "SSL connection required"
→ 연결 문자열에 `?sslmode=require` 추가
→ Node.js에서: `ssl: { rejectUnauthorized: false }` 설정

### "Password authentication failed"
→ Supabase Settings → Database → Reset database password
→ 새 비밀번호로 다시 시도

### 특정 테이블이 이미 존재
→ SQL 파일의 해당 부분만 주석 처리하고 재실행

---

## 💡 권장사항

**가장 쉬운 방법: Supabase SQL Editor 사용!**

1. 복사/붙여넣기만 하면 됨
2. 연결 정보 걱정 없음
3. SSL 설정 불필요
4. 즉시 결과 확인 가능

로컬 psql이나 Node.js는 자동화가 필요할 때만 사용하세요.
