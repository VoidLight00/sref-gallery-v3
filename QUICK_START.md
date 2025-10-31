# ⚡ SREF Gallery v3 - 빠른 시작 가이드

> **5분 안에 프로덕션 백엔드 실행하기!**

## 📋 준비물

- ✅ Node.js 18+ 설치
- ✅ Supabase 계정 (무료: https://supabase.com)
- ✅ 코드 에디터 (VS Code 권장)

---

## 🚀 1단계: Supabase 프로젝트 생성 (2분)

### 1. Supabase 접속 및 프로젝트 생성
1. https://supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 이름 입력 (예: `sref-gallery`)
4. 강력한 비밀번호 입력
5. 리전 선택 (Seoul 권장)
6. "Create new project" 클릭
7. ⏳ 프로젝트 생성 대기 (약 1-2분)

### 2. API 키 복사
프로젝트 대시보드에서:
1. 좌측 메뉴 → "Project Settings" (⚙️ 아이콘)
2. "API" 탭 클릭
3. 다음 값들 복사:
   - `Project URL`
   - `anon public` key
   - `service_role` key

---

## 🔧 2단계: 환경 변수 설정 (1분)

### 프로젝트 루트의 `.env.local` 파일 수정:

```env
# Supabase (복사한 값 입력)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# NextAuth (랜덤 문자열 생성)
NEXTAUTH_SECRET="your-super-secret-key-change-this"
NEXTAUTH_URL="http://localhost:3000"
```

**NEXTAUTH_SECRET 생성 방법:**
```bash
# 터미널에서 실행
openssl rand -base64 32
```

---

## 💾 3단계: 데이터베이스 설정 (1분)

### 1. SQL 스크립트 복사
`database/migrations/001_initial_setup.sql` 파일 전체 내용 복사

### 2. Supabase SQL Editor에서 실행
1. Supabase 대시보드
2. 좌측 메뉴 → "SQL Editor"
3. "+ New query" 클릭
4. 복사한 SQL 스크립트 붙여넣기
5. "Run" 버튼 클릭 (또는 Ctrl+Enter)
6. ✅ "Success. No rows returned" 확인

**이 스크립트가 자동으로 처리:**
- ✅ 모든 테이블 생성
- ✅ RLS 보안 정책 설정
- ✅ Storage 버킷 생성
- ✅ 트리거 및 함수 생성
- ✅ 기본 카테고리 8개 추가

---

## 🎯 4단계: Prisma 설정 (1분)

### 터미널에서 실행:

```bash
# 1. 프로젝트 디렉토리로 이동
cd /Users/voidlight/claude-code/projects/sref-gallery-v3

# 2. 의존성 설치 (이미 했다면 스킵)
npm install

# 3. Supabase 스키마로 교체
cp prisma/schema.supabase.prisma prisma/schema.prisma

# 4. Prisma 클라이언트 생성
npx prisma generate

# 5. (옵션) Prisma Studio로 데이터 확인
npx prisma studio
```

---

## ▶️ 5단계: 개발 서버 실행

```bash
# 개발 서버 실행
npm run dev
```

브라우저에서 열기:
- **프론트엔드**: http://localhost:3000
- **API 테스트**: http://localhost:3000/api/sref

---

## ✅ 6단계: 동작 확인

### API 테스트:

```bash
# 1. SREF 목록 조회
curl http://localhost:3000/api/sref

# 2. 카테고리 필터
curl http://localhost:3000/api/sref?category=anime

# 3. 검색
curl http://localhost:3000/api/sref?search=test
```

### Supabase Dashboard 확인:
1. Table Editor → `categories` 테이블
2. 8개 카테고리가 생성되어 있는지 확인

---

## 🎉 완료!

**축하합니다! 프로덕션 백엔드가 실행 중입니다!**

### 다음 할 일:

#### 1. 테스트 데이터 추가
Supabase Dashboard → Table Editor에서:
- `sref_codes` 테이블에 샘플 데이터 추가
- 또는 Prisma Studio 사용

#### 2. 이미지 업로드 테스트
```typescript
// API에서 사용
import { uploadSrefImage } from '@/lib/supabase-server';

const { url } = await uploadSrefImage(file, userId, srefId);
```

#### 3. 프론트엔드 연결
기존 mock data hooks를 실제 API로 교체

---

## 🐛 문제 해결

### 문제 1: "Failed to fetch"
**해결:**
- .env.local 파일 확인
- 환경 변수가 올바른지 확인
- 개발 서버 재시작 (`npm run dev`)

### 문제 2: SQL 실행 오류
**해결:**
- SQL Editor에서 에러 메시지 확인
- 스크립트를 부분별로 실행
- Extensions 확인 (uuid-ossp, pg_trgm)

### 문제 3: Prisma 오류
**해결:**
```bash
# Prisma 캐시 삭제 후 재생성
rm -rf node_modules/.prisma
npx prisma generate
```

### 문제 4: 포트 충돌
**해결:**
```bash
# 다른 포트 사용
npm run dev -- -p 3001
```

---

## 📊 현재 상태 확인

### 1. 데이터베이스
```bash
# Prisma Studio 실행
npx prisma studio
```

### 2. API 상태
```bash
# Health Check
curl http://localhost:3000/api/health
```

### 3. Supabase 상태
- Dashboard → Project Settings → API
- "Pause project" 상태가 아닌지 확인

---

## 🔐 보안 체크리스트

설정 후 확인:
- [ ] `.env.local` 파일이 `.gitignore`에 포함됨
- [ ] Service role key는 서버에서만 사용
- [ ] NEXTAUTH_SECRET이 강력함
- [ ] Supabase RLS 정책 활성화됨

---

## 📚 다음 단계 문서

더 자세한 내용:
- **상세 가이드**: [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)
- **API 문서**: [README_SUPABASE_MCP.md](./README_SUPABASE_MCP.md)
- **구현 요약**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

---

## 🎯 주요 API 엔드포인트

### GET /api/sref
SREF 목록 조회
```bash
curl "http://localhost:3000/api/sref?page=1&limit=20"
```

### POST /api/sref
새 SREF 생성 (인증 필요)
```bash
curl -X POST http://localhost:3000/api/sref \
  -H "Content-Type: application/json" \
  -d '{"code":"sref-test","title":"Test SREF"}'
```

### GET /api/sref/[id]
단일 SREF 조회
```bash
curl http://localhost:3000/api/sref/[id]
```

### POST /api/sref/[id]/like
좋아요 토글 (인증 필요)
```bash
curl -X POST http://localhost:3000/api/sref/[id]/like
```

---

## 💡 유용한 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start

# Prisma Studio
npx prisma studio

# Prisma 마이그레이션
npx prisma migrate dev

# 타입 체크
npm run typecheck

# 린트
npm run lint
```

---

## ⚡ 성능 팁

1. **캐싱 활용**
   - 카테고리/태그는 클라이언트 캐싱
   - API 응답 캐싱 고려

2. **이미지 최적화**
   - Next.js Image 컴포넌트 사용
   - Supabase Storage CDN 활용

3. **데이터베이스 쿼리**
   - 필요한 필드만 select
   - 페이지네이션 사용
   - 인덱스 활용

---

## 🚀 배포 준비

### Vercel 배포:
1. Vercel 프로젝트 연결
2. 환경 변수 추가
3. 자동 배포

### 환경 변수 (Production):
```env
NEXT_PUBLIC_SUPABASE_URL="your-production-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-production-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-production-service-key"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://yourdomain.com"
```

---

## 📞 도움이 필요하신가요?

1. **문서 확인**: [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)
2. **Supabase Docs**: https://supabase.com/docs
3. **Next.js Docs**: https://nextjs.org/docs
4. **GitHub Issues**: 프로젝트 레포지토리

---

**🎉 성공적인 개발 되세요!**

*Last updated: 2025-01-11*
