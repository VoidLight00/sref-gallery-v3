# 🚀 Supabase 신규 프로젝트 생성 가이드 (5분 완성)

## 📋 빠른 설정 체크리스트

- [ ] 1. Supabase 새 프로젝트 생성 (2분)
- [ ] 2. Database 마이그레이션 실행 (1분)
- [ ] 3. API Keys 복사 (30초)
- [ ] 4. .env.local 업데이트 (30초)
- [ ] 5. 빌드 테스트 (1분)

---

## 1️⃣ 새 Supabase 프로젝트 생성

### 단계 1: 프로젝트 생성
1. **https://supabase.com/dashboard** 접속
2. **"New Project"** 버튼 클릭
3. 다음 정보 입력:

```
Project Name: sref-gallery-v3
Database Password: [강력한 비밀번호 생성 - 저장 필수!]
Region: Northeast Asia (Seoul) - ap-northeast-2
Pricing Plan: Free
```

4. **"Create new project"** 클릭
5. ⏱️ 프로젝트 생성 대기 (약 2분)

---

## 2️⃣ Database 마이그레이션 실행

### 프로젝트 생성 완료 후:

1. **좌측 메뉴에서 "SQL Editor"** 클릭
2. **"New Query"** 버튼 클릭
3. 아래 파일의 전체 내용을 복사:
   ```
   📁 database/migrations/001_initial_setup.sql
   ```

4. SQL Editor에 붙여넣기
5. **"Run"** 버튼 클릭 (Cmd/Ctrl + Enter)
6. ✅ Success 메시지 확인

### 검증 쿼리 (선택사항):
```sql
-- 테이블 생성 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 예상 결과: categories, comments, favorites, likes, 
--           sref_analytics, sref_codes, sref_images, 
--           tags, users 등
```

---

## 3️⃣ API Keys 복사

### Supabase Dashboard에서:

1. **좌측 메뉴 "Settings"** 클릭
2. **"API"** 탭 선택
3. 다음 3개 값을 복사 (메모장에 저장):

```bash
# 1. Project URL
https://xxxxxxxxxxxxx.supabase.co

# 2. anon public key (공개 가능)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjg...

# 3. service_role key (⚠️ 절대 공개하지 마세요!)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQi...
```

---

## 4️⃣ .env.local 업데이트

### 프로젝트 루트에서:

```bash
# .env.local 파일 열기
nano .env.local
# 또는
code .env.local
```

### 복사한 값들로 교체:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"  # ← 1번에서 복사한 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."                # ← 2번에서 복사한 anon key
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."                    # ← 3번에서 복사한 service_role key

# NextAuth Configuration
NEXTAUTH_SECRET="your-secret-here"  # ← 아래 명령어로 생성
NEXTAUTH_URL="http://localhost:3000"
```

### NEXTAUTH_SECRET 생성:

```bash
# 터미널에서 실행
openssl rand -base64 32

# 출력된 문자열을 NEXTAUTH_SECRET에 붙여넣기
# 예: NEXTAUTH_SECRET="abc123xyz789..."
```

### 저장:
- nano: `Ctrl + O` → `Enter` → `Ctrl + X`
- VS Code: `Cmd/Ctrl + S`

---

## 5️⃣ 빌드 테스트

### 로컬에서 빌드 테스트:

```bash
# 1. 의존성 설치 (이미 했으면 생략)
npm install

# 2. 프로덕션 빌드
npm run build

# 3. 성공 확인
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Finalizing page optimization
```

### 성공 메시지 예시:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    137 B          87.2 kB
├ ○ /api/auth/[...nextauth]             0 B                0 B
├ ○ /api/auth/register                   0 B                0 B
└ ○ /api/sref-codes                      0 B                0 B

○  (Static)  prerendered as static content
```

---

## ✅ 완료 확인

### 모든 단계가 완료되었다면:

- [x] Supabase 프로젝트 생성 완료
- [x] Database 마이그레이션 실행 완료
- [x] API Keys 복사 완료
- [x] .env.local 업데이트 완료
- [x] 빌드 테스트 통과

### 다음 단계:
```bash
# Netlify 배포
netlify deploy --prod
```

---

## 🔧 문제 해결

### 문제 1: "Invalid URL" 빌드 에러
**원인**: .env.local의 URL이 잘못됨

**해결**:
```bash
# .env.local 확인
cat .env.local | grep SUPABASE_URL

# 올바른 형식: https://xxxxx.supabase.co (끝에 / 없음)
```

### 문제 2: "Failed to connect to database"
**원인**: Service Role Key가 잘못됨

**해결**:
1. Supabase Dashboard → Settings → API
2. service_role key 다시 복사
3. .env.local에 업데이트

### 문제 3: "Table does not exist"
**원인**: 마이그레이션 미실행

**해결**:
1. Supabase Dashboard → SQL Editor
2. 001_initial_setup.sql 다시 실행
3. 에러 메시지 확인

---

## 📊 Storage 버킷 확인 (선택사항)

### Supabase Dashboard에서:

1. **"Storage"** 메뉴 클릭
2. **"sref-images"** 버킷 확인
3. Public 접근 가능 확인

### 버킷 정책 확인:
```sql
-- Storage policies 확인
SELECT * FROM storage.objects WHERE bucket_id = 'sref-images';
```

---

## 🎯 빠른 참조

### Supabase Dashboard 주요 메뉴:
- **SQL Editor**: 쿼리 실행
- **Table Editor**: 데이터 확인/수정
- **Authentication**: 사용자 관리 (NextAuth 사용 시 비활성화됨)
- **Storage**: 파일 업로드/관리
- **Logs**: API 호출 로그
- **Settings → API**: Credentials 확인

### 환경 변수 요약:
```bash
# 로컬 개발
NEXTAUTH_URL="http://localhost:3000"

# Netlify 배포 시
NEXTAUTH_URL="https://your-site.netlify.app"
```

---

**작성일**: 2025-01-11
**소요 시간**: 약 5분
**상태**: ✅ 신규 프로젝트 생성 가이드 완성
