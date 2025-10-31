# 🚀 Netlify 배포 완료 가이드

## ✅ 완료된 작업

1. ✅ Supabase 프로젝트 생성 및 설정
2. ✅ 환경 변수 로컬 설정 완료
3. ✅ Database 마이그레이션 SQL 준비
4. ✅ 프로덕션 빌드 성공
5. ✅ Git 리포지토리 커밋
6. ✅ GitHub에 코드 push 완료

**GitHub Repository**: https://github.com/VoidLight00/sref-gallery-v3

---

## 🎯 다음 단계: Netlify 배포 (3분 소요)

### 1️⃣ Netlify에서 GitHub 리포지토리 연결

1. **https://app.netlify.com** 접속
2. **"Add new site"** 클릭 → **"Import an existing project"** 선택
3. **"Deploy with GitHub"** 클릭
4. **GitHub 계정 연결** (처음이면 권한 허용)
5. **"VoidLight00/sref-gallery-v3"** 리포지토리 선택

### 2️⃣ 빌드 설정 확인

Netlify가 자동으로 감지하지만, 확인해주세요:

```
Build command: npm run build
Publish directory: .next
```

**중요**: `netlify.toml` 파일이 있어서 자동 설정됩니다!

### 3️⃣ 환경 변수 설정 (필수!)

**Site settings** → **Environment variables** → **Add a variable**

다음 4개를 추가하세요:

```bash
# 1. Supabase URL
NEXT_PUBLIC_SUPABASE_URL
https://woqkzthyqxscamjyhcis.supabase.co

# 2. Supabase Anon Key (공개 키)
NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWt6dGh5cXhzY2FtanloY2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1Nzk2OTEsImV4cCI6MjA1MjE1NTY5MX0.VYM6YrI7WV0KjwW0xrPGxqKvN-xj4Lg8bgwHvZmLGjg

# 3. Supabase Service Role Key (⚠️ 비밀 키)
SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWt6dGh5cXhzY2FtanloY2lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjU3OTY5MSwiZXhwIjoyMDUyMTU1NjkxfQ.WoGxw3hzLKthM2CN5xULRQ_nYxc2Fei

# 4. NextAuth Secret
NEXTAUTH_SECRET
yVvYJaO/jatMUK+cJBBRRIPAOyW73pdkng+PwRJ+yV4=
```

### 4️⃣ NEXTAUTH_URL 업데이트

**첫 배포 후** Netlify URL을 받으면:

1. 환경 변수에 **NEXTAUTH_URL** 추가:
   ```
   https://your-site-name.netlify.app
   ```
2. **"Clear cache and deploy site"** 클릭하여 재배포

### 5️⃣ Supabase Database 마이그레이션

Netlify 배포 전에 **필수**로 실행해야 합니다:

1. **https://supabase.com/dashboard** 접속
2. 프로젝트 선택: **woqkzthyqxscamjyhcis**
3. **SQL Editor** 메뉴 클릭
4. **New Query** 버튼
5. 다음 파일 내용을 복사하여 붙여넣기:
   ```
   database/migrations/001_initial_setup.sql
   ```
6. **Run** 버튼 (Cmd/Ctrl + Enter)
7. ✅ Success 메시지 확인

**검증 쿼리**:
```sql
-- 테이블 생성 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## 🎊 배포 완료 후 확인

### 자동 배포 확인:
1. Netlify Dashboard → **Deploys** 탭
2. 빌드 로그 확인
3. 배포 완료 후 URL 클릭

### 기능 테스트:
- [ ] 메인 페이지 로드 확인
- [ ] 카테고리 페이지 동작 확인
- [ ] SREF 코드 검색 테스트
- [ ] API 엔드포인트 응답 확인

### 예상 배포 시간:
- **첫 배포**: 약 3-5분
- **이후 배포**: 약 1-2분 (자동)

---

## 📊 배포 완료 상태

```
✅ 프로젝트 설정: 100%
✅ 백엔드 통합: 100% (NextAuth + Supabase)
✅ 프론트엔드 빌드: 100%
✅ Git/GitHub: 100%
⏳ Netlify 배포: 환경 변수 설정 대기 중
⏳ Database 마이그레이션: 실행 대기 중
```

---

## 🔧 문제 해결

### 빌드 실패 시:
1. Netlify 빌드 로그 확인
2. 환경 변수 4개가 모두 설정되었는지 확인
3. `netlify.toml` 파일이 리포지토리에 있는지 확인

### 데이터베이스 에러 시:
1. Supabase SQL Editor에서 마이그레이션 실행 확인
2. Supabase 프로젝트가 활성 상태인지 확인
3. 환경 변수의 URL과 키가 정확한지 확인

### API 에러 시:
1. `NEXTAUTH_URL`이 올바른 Netlify URL인지 확인
2. Browser Console에서 에러 메시지 확인
3. Netlify Functions 로그 확인

---

## 📚 참고 문서

- **Netlify 배포 가이드**: `NETLIFY_DEPLOYMENT_GUIDE.md`
- **Supabase 설정 가이드**: `SUPABASE_SETUP_QUICK_GUIDE.md`
- **NextAuth 통합 보고서**: `NEXTAUTH_SUPABASE_INTEGRATION_REPORT.md`

---

**배포 준비 완료!** 🎉

위 단계를 따라하시면 3분 안에 배포가 완료됩니다.
