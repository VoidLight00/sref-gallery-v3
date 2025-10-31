# 🚀 SREF Gallery v3 배포 가이드

**작성일**: 2025-01-11
**대상 환경**: Vercel + Supabase PostgreSQL

---

## 📋 배포 전 체크리스트

- [x] NextAuth + Supabase Auth 통합 완료
- [x] 모든 API Routes 구현 완료
- [x] Database Schema 준비 완료
- [ ] Supabase 프로젝트 생성
- [ ] Database 마이그레이션 실행
- [ ] 환경 변수 설정
- [ ] 로컬 빌드 테스트
- [ ] Vercel 배포
- [ ] 배포 후 검증

---

## 1️⃣ Supabase 프로젝트 설정

### 1.1 Supabase 프로젝트 생성

1. https://supabase.com 접속 및 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `sref-gallery-v3`
   - **Database Password**: 강력한 비밀번호 생성 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)` 선택 권장
   - **Pricing Plan**: Free tier 시작 가능

4. 프로젝트 생성 대기 (약 2분)

### 1.2 Supabase Credentials 복사

프로젝트 생성 완료 후:

1. 좌측 메뉴에서 **Settings** > **API** 클릭
2. 다음 값들을 복사:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOi...
   service_role key: eyJhbGciOi... (⚠️ 절대 공개하지 마세요!)
   ```

### 1.3 Database 마이그레이션 실행

1. Supabase Dashboard에서 **SQL Editor** 클릭
2. "New Query" 클릭
3. `database/migrations/001_initial_setup.sql` 파일 내용 전체 복사
4. SQL Editor에 붙여넣기
5. **Run** 버튼 클릭 (⏱️ 약 10-15초 소요)

**검증 방법**:
```sql
-- 테이블 확인
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- RLS 정책 확인
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Storage 버킷 확인
SELECT name FROM storage.buckets;
```

예상 결과:
- **테이블**: users, sref_codes, categories, tags, likes, favorites, comments, sref_images, sref_analytics 등
- **RLS 정책**: 각 테이블당 2-4개
- **Storage 버킷**: sref-images

---

## 2️⃣ 환경 변수 설정

### 2.1 로컬 환경 (.env.local)

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# NextAuth
NEXTAUTH_SECRET="your-32-char-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (선택사항)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 2.2 NEXTAUTH_SECRET 생성

```bash
openssl rand -base64 32
```

출력된 문자열을 `NEXTAUTH_SECRET`에 사용

---

## 3️⃣ Google OAuth 설정 (선택사항)

Google 로그인을 사용하려면:

### 3.1 Google Cloud Console 설정

1. https://console.cloud.google.com 접속
2. 프로젝트 생성 또는 선택
3. **APIs & Services** > **Credentials** 이동
4. **Create Credentials** > **OAuth 2.0 Client IDs** 클릭
5. Application type: **Web application**
6. **Authorized redirect URIs** 추가:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.vercel.app/api/auth/callback/google
   ```
7. **Create** 클릭
8. Client ID와 Client Secret 복사

### 3.2 환경 변수에 추가

`.env.local`에 추가:
```bash
GOOGLE_CLIENT_ID="복사한-client-id"
GOOGLE_CLIENT_SECRET="복사한-client-secret"
```

---

## 4️⃣ 로컬 빌드 테스트

배포 전 로컬에서 프로덕션 빌드 테스트:

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 프로덕션 모드 실행
npm run start
```

### 테스트 체크리스트

- [ ] http://localhost:3000 정상 접속
- [ ] API Routes 정상 동작 (`/api/sref-codes`)
- [ ] 회원가입 테스트 (`POST /api/auth/register`)
- [ ] 로그인 테스트 (Credentials)
- [ ] Google 로그인 테스트 (OAuth 설정 시)
- [ ] 빌드 에러 없음

---

## 5️⃣ Vercel 배포

### 5.1 Vercel CLI 배포 (권장)

```bash
# Vercel CLI 설치 (최초 1회)
npm i -g vercel

# Vercel 로그인
vercel login

# 프로젝트 배포
vercel

# 프로덕션 배포
vercel --prod
```

**배포 과정**:
1. Project name 입력 (기본값 사용 가능)
2. Vercel 조직 선택
3. 배포 완료 후 URL 확인

### 5.2 GitHub 연동 배포

1. GitHub에 프로젝트 Push
2. https://vercel.com 접속
3. **Import Project** 클릭
4. GitHub Repository 선택
5. **Deploy** 클릭

### 5.3 Vercel 환경 변수 설정

Vercel Dashboard에서:

1. 배포된 프로젝트 선택
2. **Settings** > **Environment Variables** 클릭
3. 다음 변수들을 추가:

```bash
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOi...
NEXTAUTH_SECRET = your-32-char-random-secret
NEXTAUTH_URL = https://your-project.vercel.app
GOOGLE_CLIENT_ID = (선택사항)
GOOGLE_CLIENT_SECRET = (선택사항)
```

4. **Save** 클릭
5. **Deployments** 탭에서 **Redeploy** 클릭

---

## 6️⃣ 배포 후 검증

### 6.1 기본 기능 테스트

```bash
# 1. 홈페이지 접속
curl https://your-project.vercel.app

# 2. API 엔드포인트 테스트
curl https://your-project.vercel.app/api/sref-codes

# 3. Health Check (선택사항)
curl https://your-project.vercel.app/api/health
```

### 6.2 Auth 플로우 테스트

1. **회원가입**:
```bash
curl -X POST https://your-project.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "username": "testuser"
  }'
```

2. **로그인** (브라우저):
   - https://your-project.vercel.app/login 접속
   - 생성한 계정으로 로그인

3. **Google OAuth** (브라우저):
   - "Sign in with Google" 클릭
   - Google 계정 선택
   - 자동 사용자 생성 확인

### 6.3 Supabase 데이터 확인

Supabase Dashboard에서:
1. **Table Editor** > **users** 테이블 확인
2. 생성된 사용자 데이터 확인
3. **Authentication** > **Users** 확인 (NextAuth는 여기 표시 안됨)

### 6.4 로그 모니터링

**Vercel Logs**:
1. Vercel Dashboard > 프로젝트 선택
2. **Logs** 탭 클릭
3. 실시간 로그 확인

**Supabase Logs**:
1. Supabase Dashboard > **Logs** 클릭
2. API, Auth, Database 로그 확인

---

## 7️⃣ 도메인 연결 (선택사항)

### 7.1 커스텀 도메인 추가

Vercel Dashboard에서:
1. 프로젝트 > **Settings** > **Domains**
2. 도메인 입력 (예: `sref-gallery.com`)
3. DNS 설정 안내에 따라 도메인 레지스트라에서 설정

### 7.2 DNS 설정 예시

도메인 레지스트라(가비아, Route53 등)에서:
```
Type: CNAME
Name: www (또는 @)
Value: cname.vercel-dns.com
```

### 7.3 Google OAuth Redirect URI 업데이트

Google Cloud Console에서:
1. OAuth 2.0 Client IDs 편집
2. Authorized redirect URIs에 추가:
   ```
   https://your-custom-domain.com/api/auth/callback/google
   ```

---

## 8️⃣ 모니터링 설정

### 8.1 Vercel Analytics

```bash
npm install @vercel/analytics
```

`app/layout.tsx`에 추가:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 8.2 Supabase Monitoring

Supabase Dashboard에서:
1. **Database** > **Extensions** > `pg_stat_statements` 활성화
2. **Logs** 탭에서 느린 쿼리 모니터링
3. **Database** > **Usage** 에서 사용량 확인

---

## 9️⃣ 문제 해결

### 문제 1: 빌드 실패 - "Module not found"

**원인**: 의존성 누락

**해결**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 문제 2: 환경 변수 인식 안됨

**원인**: Vercel 환경 변수 미설정 또는 재배포 안함

**해결**:
1. Vercel Dashboard에서 환경 변수 확인
2. 변수 추가/수정 후 **Redeploy** 필수

### 문제 3: NextAuth 세션 에러

**원인**: NEXTAUTH_SECRET 또는 NEXTAUTH_URL 미설정

**해결**:
```bash
# .env.local 확인
echo $NEXTAUTH_SECRET
echo $NEXTAUTH_URL

# Vercel 환경 변수 확인
vercel env ls
```

### 문제 4: Supabase RLS 정책 에러

**원인**: RLS 정책 미설정 또는 잘못된 정책

**해결**:
1. SQL Editor에서 마이그레이션 재실행
2. RLS 정책 확인:
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### 문제 5: Google OAuth 리디렉션 에러

**원인**: Authorized redirect URIs 미설정

**해결**:
1. Google Cloud Console 확인
2. Redirect URIs에 정확한 URL 추가:
   ```
   https://your-actual-domain.vercel.app/api/auth/callback/google
   ```

---

## 🎯 배포 완료 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] Database 마이그레이션 실행 완료
- [ ] 환경 변수 설정 완료 (로컬 + Vercel)
- [ ] 로컬 빌드 테스트 통과
- [ ] Vercel 배포 성공
- [ ] API 엔드포인트 정상 동작 확인
- [ ] 회원가입/로그인 테스트 완료
- [ ] Google OAuth 테스트 완료 (선택사항)
- [ ] Supabase 데이터 확인 완료
- [ ] 로그 모니터링 설정 완료
- [ ] 커스텀 도메인 연결 완료 (선택사항)

---

## 📚 관련 문서

- [NEXTAUTH_SUPABASE_INTEGRATION_REPORT.md](./NEXTAUTH_SUPABASE_INTEGRATION_REPORT.md)
- [API_ROUTES_COMPLETION_REPORT.md](./API_ROUTES_COMPLETION_REPORT.md)
- [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)
- [README_SUPABASE_MCP.md](./README_SUPABASE_MCP.md)

---

## 🆘 추가 도움

문제 발생 시:
1. Vercel Logs 확인
2. Supabase Logs 확인
3. 브라우저 Console 확인
4. Network 탭에서 API 응답 확인

**배포 완료 후 다음 단계**:
- [ ] 로그인/회원가입 UI 개선
- [ ] Protected Routes 구현
- [ ] 사용자 프로필 페이지
- [ ] 비밀번호 재설정 기능
- [ ] 이메일 인증 (선택사항)

---

**작성일**: 2025-01-11
**상태**: ✅ 배포 가이드 완성
