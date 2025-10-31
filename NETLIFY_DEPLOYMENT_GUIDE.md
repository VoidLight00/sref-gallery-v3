# 🚀 SREF Gallery v3 - Netlify 배포 가이드

**작성일**: 2025-01-11
**대상 환경**: Netlify + Supabase PostgreSQL + Next.js 14

---

## 📋 배포 전 체크리스트

- [x] NextAuth + Supabase Auth 통합 완료
- [x] 모든 API Routes 구현 완료
- [x] Database Schema 준비 완료
- [x] Netlify 설정 파일 생성 (`netlify.toml`)
- [ ] Supabase 프로젝트 생성
- [ ] Database 마이그레이션 실행
- [ ] 환경 변수 설정
- [ ] Netlify 계정 준비
- [ ] 로컬 빌드 테스트
- [ ] Netlify 배포
- [ ] 배포 후 검증

---

## 🎯 Netlify vs Vercel 차이점

### Netlify 장점
- ✅ **무료 대역폭**: 100GB/월 (Vercel은 100GB/월)
- ✅ **Functions**: 125,000회/월 무료 (Vercel은 1,000초/월)
- ✅ **빌드 시간**: 300분/월 무료
- ✅ **간단한 설정**: 자동 HTTPS, CDN 기본 제공
- ✅ **Edge Functions**: 글로벌 엣지 배포 지원

### 주의사항
- ⚠️ **Next.js SSR**: Netlify Functions로 변환 (약간의 성능 저하 가능)
- ⚠️ **Cold Start**: 첫 요청 시 약간의 지연 (Vercel도 동일)
- ⚠️ **ISR 제한**: 일부 ISR 기능 제한적 지원

---

## 1️⃣ Supabase 프로젝트 설정

### 1.1 Supabase 프로젝트 생성

1. https://supabase.com 접속 및 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Name**: `sref-gallery-v3`
   - **Database Password**: 강력한 비밀번호 생성 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)` 권장
   - **Pricing Plan**: Free tier 시작 가능

4. 프로젝트 생성 대기 (약 2분)

### 1.2 Supabase Credentials 복사

프로젝트 생성 완료 후:

1. 좌측 메뉴에서 **Settings** > **API** 클릭
2. 다음 값들을 복사 (나중에 Netlify 환경 변수로 사용):
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

---

## 2️⃣ Netlify 플러그인 설치

프로젝트에 Netlify Next.js 플러그인이 이미 추가되었습니다:

```bash
# 의존성 설치
npm install

# 플러그인 확인
# package.json에 "@netlify/plugin-nextjs": "^5.7.2" 추가됨
```

---

## 3️⃣ 환경 변수 준비

### 3.1 NEXTAUTH_SECRET 생성

```bash
openssl rand -base64 32
```

출력된 문자열을 저장해둡니다 (나중에 Netlify에 추가).

### 3.2 환경 변수 목록 (Netlify에 추가할 것)

```bash
# Supabase (Supabase Dashboard에서 복사)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# NextAuth (중요!)
NEXTAUTH_SECRET="your-32-char-random-secret"
NEXTAUTH_URL="https://your-site.netlify.app"

# Google OAuth (선택사항)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## 4️⃣ 로컬 테스트 (선택사항)

배포 전 로컬에서 프로덕션 빌드 테스트:

### 4.1 로컬 환경 변수 설정

`.env.local` 파일 생성:
```bash
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4.2 빌드 실행

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 프로덕션 모드 실행
npm run start
```

### 4.3 테스트 체크리스트

- [ ] http://localhost:3000 정상 접속
- [ ] API Routes 정상 동작 (`/api/sref-codes`)
- [ ] 빌드 에러 없음

---

## 5️⃣ Netlify 배포

### 방법 1: Netlify CLI 배포 (권장)

```bash
# Netlify CLI 설치 (최초 1회)
npm install -g netlify-cli

# Netlify 로그인
netlify login

# 프로젝트 초기화 및 배포
netlify init

# 프로덕션 배포
netlify deploy --prod
```

**배포 과정**:
1. Team 선택
2. Site name 입력 (기본값 사용 가능)
3. Build command 확인: `npm run build`
4. Publish directory 확인: `.next`
5. 배포 완료 후 URL 확인

### 방법 2: GitHub 연동 자동 배포

#### 5.1 GitHub에 프로젝트 Push

```bash
# Git 초기화 (이미 되어있으면 생략)
git init
git add .
git commit -m "feat: Initial commit for Netlify deployment"

# GitHub 원격 저장소 추가
git remote add origin https://github.com/your-username/sref-gallery-v3.git
git push -u origin main
```

#### 5.2 Netlify에서 GitHub 연동

1. https://app.netlify.com 접속
2. "Add new site" > "Import an existing project" 클릭
3. "GitHub" 선택
4. Repository 선택: `your-username/sref-gallery-v3`
5. 빌드 설정 확인:
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
6. "Deploy site" 클릭

---

## 6️⃣ Netlify 환경 변수 설정

### 6.1 Netlify Dashboard 접근

1. 배포된 사이트 선택
2. **Site configuration** > **Environment variables** 클릭
3. "Add a variable" 클릭

### 6.2 환경 변수 추가

다음 변수들을 **하나씩** 추가:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOi...

# NextAuth
NEXTAUTH_SECRET = your-32-char-random-secret
NEXTAUTH_URL = https://your-actual-site.netlify.app

# Google OAuth (선택사항)
GOOGLE_CLIENT_ID = your-google-client-id
GOOGLE_CLIENT_SECRET = your-google-client-secret
```

### 6.3 재배포

환경 변수 추가 후:

**CLI 사용 시:**
```bash
netlify deploy --prod
```

**GitHub 연동 시:**
- **Deploys** 탭 > **Trigger deploy** > **Clear cache and deploy site**

---

## 7️⃣ Google OAuth 설정 (선택사항)

Google 로그인을 사용하려면:

### 7.1 Google Cloud Console 설정

1. https://console.cloud.google.com 접속
2. 프로젝트 생성 또는 선택
3. **APIs & Services** > **Credentials** 이동
4. **Create Credentials** > **OAuth 2.0 Client IDs** 클릭
5. Application type: **Web application**
6. **Authorized redirect URIs** 추가:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-site.netlify.app/api/auth/callback/google
   ```
7. **Create** 클릭
8. Client ID와 Client Secret을 Netlify 환경 변수에 추가

---

## 8️⃣ 배포 후 검증

### 8.1 기본 기능 테스트

```bash
# 1. 홈페이지 접속
curl https://your-site.netlify.app

# 2. API 엔드포인트 테스트
curl https://your-site.netlify.app/api/sref-codes

# 3. Health Check
curl https://your-site.netlify.app/api/health
```

### 8.2 Auth 플로우 테스트

1. **회원가입**:
```bash
curl -X POST https://your-site.netlify.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "username": "testuser"
  }'
```

2. **로그인** (브라우저):
   - https://your-site.netlify.app/login 접속
   - 생성한 계정으로 로그인

3. **Google OAuth** (브라우저):
   - "Sign in with Google" 클릭
   - Google 계정 선택

### 8.3 Netlify Functions 확인

Netlify Dashboard에서:
1. **Functions** 탭 클릭
2. 배포된 Functions 목록 확인
3. 로그 확인 (에러 체크)

### 8.4 로그 모니터링

**Netlify Logs**:
1. Netlify Dashboard > 사이트 선택
2. **Functions** > **Logs** 탭
3. 실시간 로그 확인

**Supabase Logs**:
1. Supabase Dashboard > **Logs** 클릭
2. API, Auth, Database 로그 확인

---

## 9️⃣ 커스텀 도메인 연결 (선택사항)

### 9.1 도메인 추가

Netlify Dashboard에서:
1. 사이트 선택 > **Domain management**
2. "Add custom domain" 클릭
3. 도메인 입력 (예: `sref-gallery.com`)

### 9.2 DNS 설정

도메인 레지스트라(가비아, Route53 등)에서:

**CNAME 레코드 추가:**
```
Type: CNAME
Name: www (또는 @)
Value: your-site.netlify.app
TTL: 3600
```

**또는 A 레코드 (Netlify Load Balancer IP):**
```
Type: A
Name: @
Value: 75.2.60.5
```

### 9.3 HTTPS 활성화

Netlify가 자동으로 Let's Encrypt SSL 인증서를 발급합니다 (약 1-2분 소요).

### 9.4 Google OAuth Redirect URI 업데이트

Google Cloud Console에서:
1. OAuth 2.0 Client IDs 편집
2. Authorized redirect URIs에 추가:
   ```
   https://your-custom-domain.com/api/auth/callback/google
   ```

---

## 🔟 성능 최적화

### 10.1 CDN 캐싱

Netlify는 자동으로 정적 파일을 CDN에 캐싱합니다. `netlify.toml`에서 캐시 설정 확인:

```toml
[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 10.2 Edge Functions (선택사항)

특정 API를 Edge에서 실행하려면:

```bash
# .netlify/edge-functions/ 디렉토리 생성
mkdir -p .netlify/edge-functions

# Edge Function 생성
# 예: .netlify/edge-functions/hello.ts
```

### 10.3 빌드 플러그인 최적화

`netlify.toml`에 추가 플러그인 설정:

```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"

[[plugins]]
  package = "netlify-plugin-cache"
  [plugins.inputs]
    paths = ["node_modules", ".next/cache"]
```

---

## 1️⃣1️⃣ 모니터링 및 분석

### 11.1 Netlify Analytics 활성화

Netlify Dashboard에서:
1. 사이트 선택 > **Analytics** 탭
2. "Enable Analytics" 클릭 (유료 기능, $9/월)
3. 트래픽, 페이지뷰, 대역폭 모니터링

### 11.2 Functions Monitoring

```bash
# Netlify CLI로 Functions 로그 확인
netlify functions:log

# 특정 Function 로그
netlify functions:log [function-name]
```

### 11.3 Supabase Monitoring

Supabase Dashboard에서:
1. **Database** > **Usage** - DB 사용량
2. **Storage** > **Usage** - 스토리지 사용량
3. **Logs** - API 호출 로그

---

## 1️⃣2️⃣ 문제 해결

### 문제 1: 빌드 실패 - "Module not found"

**원인**: 의존성 누락

**해결**:
```bash
rm -rf node_modules package-lock.json
npm install
netlify deploy --prod
```

### 문제 2: API Routes 404 에러

**원인**: Netlify Functions 변환 실패

**해결**:
1. `netlify.toml` 설정 확인
2. `@netlify/plugin-nextjs` 최신 버전 사용
3. 빌드 로그 확인

### 문제 3: 환경 변수 인식 안됨

**원인**: Netlify 환경 변수 미설정 또는 재배포 안함

**해결**:
1. Netlify Dashboard에서 환경 변수 확인
2. **Clear cache and deploy site** 실행

### 문제 4: NextAuth 세션 에러

**원인**: `NEXTAUTH_URL` 잘못 설정

**해결**:
```bash
# NEXTAUTH_URL을 실제 Netlify URL로 설정
NEXTAUTH_URL = https://your-actual-site.netlify.app
```

### 문제 5: Supabase 연결 실패

**원인**: Service Role Key 미설정

**해결**:
1. Supabase Dashboard에서 Service Role Key 확인
2. Netlify 환경 변수에 `SUPABASE_SERVICE_ROLE_KEY` 추가
3. 재배포

### 문제 6: Cold Start 지연

**원인**: Netlify Functions의 첫 요청 시 초기화

**해결책**:
- 자주 사용하는 API는 Edge Functions로 전환
- 핑 서비스 사용 (예: UptimeRobot)
- Netlify Pro 플랜 사용 (Background Functions)

---

## 1️⃣3️⃣ 배포 완료 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] Database 마이그레이션 실행 완료
- [ ] Netlify 플러그인 설치 완료
- [ ] 환경 변수 설정 완료 (Netlify)
- [ ] 로컬 빌드 테스트 통과 (선택)
- [ ] Netlify 배포 성공
- [ ] `netlify.toml` 설정 확인
- [ ] API 엔드포인트 정상 동작 확인
- [ ] 회원가입/로그인 테스트 완료
- [ ] Google OAuth 테스트 완료 (선택사항)
- [ ] Supabase 데이터 확인 완료
- [ ] 로그 모니터링 설정 완료
- [ ] 커스텀 도메인 연결 완료 (선택사항)
- [ ] HTTPS 활성화 확인

---

## 1️⃣4️⃣ Netlify vs Vercel 비교

| 기능 | Netlify | Vercel |
|------|---------|--------|
| 무료 대역폭 | 100GB/월 | 100GB/월 |
| Functions 호출 | 125,000회/월 | 1,000초/월 |
| 빌드 시간 | 300분/월 | 6,000분/월 |
| Edge Functions | ✅ 지원 | ✅ 지원 |
| Next.js ISR | 제한적 | 완전 지원 |
| 배포 속도 | 빠름 | 매우 빠름 |
| 학습 곡선 | 쉬움 | 쉬움 |
| 가격 (Pro) | $19/월 | $20/월 |

---

## 1️⃣5️⃣ 다음 단계

**배포 완료 후 추천 작업:**
- [ ] 로그인/회원가입 UI 구현
- [ ] Protected Routes 설정
- [ ] 사용자 프로필 페이지
- [ ] 비밀번호 재설정 기능
- [ ] 이메일 인증 (선택사항)
- [ ] SEO 최적화
- [ ] Google Analytics 설정
- [ ] 성능 모니터링 (Sentry 등)

---

## 📚 관련 문서

- [NEXTAUTH_SUPABASE_INTEGRATION_REPORT.md](./NEXTAUTH_SUPABASE_INTEGRATION_REPORT.md)
- [API_ROUTES_COMPLETION_REPORT.md](./API_ROUTES_COMPLETION_REPORT.md)
- [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)
- [README_SUPABASE_MCP.md](./README_SUPABASE_MCP.md)

---

## 🆘 추가 도움

**Netlify 공식 문서:**
- Next.js on Netlify: https://docs.netlify.com/frameworks/next-js/overview/
- Functions: https://docs.netlify.com/functions/overview/
- Environment Variables: https://docs.netlify.com/environment-variables/overview/

**문제 발생 시:**
1. Netlify Functions 로그 확인
2. Supabase Logs 확인
3. 브라우저 Console 확인
4. Network 탭에서 API 응답 확인

---

**작성일**: 2025-01-11
**상태**: ✅ Netlify 배포 가이드 완성
**대상**: Netlify + Supabase + Next.js 14

🎯 **SREF Gallery v3가 Netlify에 배포될 준비가 완료되었습니다!**
