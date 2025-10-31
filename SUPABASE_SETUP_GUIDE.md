# 🚀 Supabase MCP 백엔드 설정 가이드

## ✅ 완료된 구현

### 1. Prisma Schema (Production)
- ✅ PostgreSQL 스키마 정의 완료
- ✅ Supabase용 전체 테이블 구조
- ✅ RLS (Row Level Security) 지원
- ✅ 관계 및 인덱스 최적화

### 2. Supabase 통합
- ✅ Server-side 클라이언트 구성
- ✅ 이미지 업로드/삭제 헬퍼
- ✅ SREF CRUD 작업
- ✅ 좋아요/즐겨찾기 기능
- ✅ 전체 텍스트 검색
- ✅ 분석 트래킹

### 3. API Routes
- ✅ `/api/sref` - SREF 목록/생성
- ✅ `/api/sref/[id]` - 단일 SREF 조회/수정/삭제
- ✅ `/api/sref/[id]/like` - 좋아요 토글
- ✅ `/api/sref/[id]/favorite` - 즐겨찾기 토글

---

## 📋 설정 단계

### 1️⃣ Supabase 프로젝트 생성

1. https://supabase.com 방문
2. 새 프로젝트 생성
3. 프로젝트 설정에서 다음 정보 복사:
   - `Project URL`
   - `anon public key`
   - `service_role key`

### 2️⃣ 환경 변수 설정

`.env.local` 파일에 실제 Supabase 정보 입력:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3️⃣ 데이터베이스 마이그레이션

**Supabase Dashboard의 SQL Editor에서 실행:**

```bash
# database/migrations/001_initial_setup.sql 파일 내용을 복사하여 실행
```

이 스크립트는 다음을 설정합니다:
- ✅ 모든 테이블 생성
- ✅ RLS (Row Level Security) 정책
- ✅ Storage 버킷 생성
- ✅ 트리거 및 함수
- ✅ 인덱스 최적화
- ✅ 기본 카테고리 시드

### 4️⃣ Prisma 설정

```bash
# Prisma 스키마를 Supabase용으로 교체
cp prisma/schema.supabase.prisma prisma/schema.prisma

# Prisma 클라이언트 생성
npx prisma generate

# (옵션) Prisma Studio로 데이터 확인
npx prisma studio
```

---

## 🎯 주요 기능

### 1. 이미지 업로드 (Supabase Storage)

```typescript
import { uploadSrefImage } from '@/lib/supabase-server';

// 이미지 업로드
const { url, path } = await uploadSrefImage(file, userId, srefId);
```

### 2. SREF 코드 생성

```typescript
import { createSrefCode } from '@/lib/supabase-server';

const srefCode = await createSrefCode({
  code: 'sref-12345',
  title: 'Amazing Style',
  description: 'Description here',
  promptExamples: ['prompt 1', 'prompt 2'],
  userId: user.id,
  categoryIds: ['cat-id-1'],
  tagIds: ['tag-id-1', 'tag-id-2']
});
```

### 3. SREF 코드 조회 (필터링)

```typescript
import { getSrefCodes } from '@/lib/supabase-server';

const result = await getSrefCodes({
  page: 1,
  limit: 20,
  categoryId: 'anime-id',
  featured: true,
  search: 'cyberpunk'
});
```

### 4. 전체 텍스트 검색

```typescript
import { searchSrefCodes } from '@/lib/supabase-server';

const results = await searchSrefCodes('anime style', 1, 20);
```

### 5. 좋아요/즐겨찾기

```typescript
import { toggleLike, toggleFavorite } from '@/lib/supabase-server';

const { liked } = await toggleLike(userId, srefId);
const { favorited } = await toggleFavorite(userId, srefId);
```

---

## 🔒 보안 (Row Level Security)

### 자동으로 적용된 RLS 정책:

1. **Public Access**
   - ✅ 활성화된 SREF 코드 조회
   - ✅ 카테고리/태그 조회
   - ✅ 댓글 조회

2. **Authenticated Users**
   - ✅ SREF 코드 생성
   - ✅ 자신의 SREF 수정/삭제
   - ✅ 좋아요/즐겨찾기 추가/제거
   - ✅ 댓글 작성

3. **Premium Content**
   - ✅ 프리미엄 SREF는 인증된 사용자만 조회

---

## 🌐 Realtime 기능

### Supabase Realtime 구독 설정:

```typescript
import { supabase } from '@/lib/supabase';

// 좋아요 실시간 업데이트 구독
const subscription = supabase
  .channel('sref-likes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'likes',
      filter: `sref_code_id=eq.${srefId}`
    },
    (payload) => {
      console.log('Like updated:', payload);
    }
  )
  .subscribe();
```

---

## 📊 분석 트래킹

```typescript
import { trackAnalytics } from '@/lib/supabase-server';

// 이벤트 트래킹
await trackAnalytics({
  srefCodeId: srefId,
  eventType: 'VIEW',
  userId: user?.id,
  metadata: { source: 'gallery' }
});
```

---

## 🧪 테스트

### API 엔드포인트 테스트:

```bash
# SREF 목록 조회
curl http://localhost:3000/api/sref

# 카테고리별 필터링
curl http://localhost:3000/api/sref?category=anime-id&limit=10

# 검색
curl http://localhost:3000/api/sref?search=cyberpunk

# 특정 SREF 조회
curl http://localhost:3000/api/sref/[sref-id]
```

---

## 📈 성능 최적화

### 1. 인덱스
- ✅ 모든 외래 키에 인덱스
- ✅ 검색 최적화 (GIN 인덱스)
- ✅ 정렬 필드 인덱스

### 2. 캐싱
- ✅ 카테고리/태그는 클라이언트 측 캐싱 권장
- ✅ Redis 통합 준비 완료

### 3. 페이지네이션
- ✅ 커서 기반 페이지네이션 지원
- ✅ 총 개수 카운트

---

## 🚀 배포

### Vercel 배포 시:

1. Vercel 대시보드에서 환경 변수 설정
2. Production 빌드 실행:
```bash
npm run build
```

### 환경 변수 체크리스트:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL` (프로덕션 URL)

---

## 🔗 다음 단계

### 남은 작업:
1. ⚠️ **프론트엔드 연결**: API 클라이언트를 실제 Supabase hooks로 교체
2. ⚠️ **이미지 최적화**: Next.js Image 컴포넌트 통합
3. ⚠️ **댓글 시스템**: 댓글 UI 구현
4. ⚠️ **사용자 프로필**: 프로필 페이지 완성

### 권장 개선사항:
- 🟢 Supabase Edge Functions 활용
- 🟢 실시간 알림 시스템
- 🟢 고급 분석 대시보드
- 🟢 소셜 공유 기능

---

## 📚 추가 리소스

- [Supabase Docs](https://supabase.com/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**✅ Supabase MCP 백엔드 구현 완료!**

이제 실제 작동하는 프로덕션 백엔드가 준비되었습니다.
프론트엔드 연결만 하면 완전히 기능하는 애플리케이션이 됩니다!
