# 🚀 Netlify + Supabase 통합 가이드

## ✅ 네, 가능합니다!

Netlify를 프론트엔드/Functions 호스팅으로 사용하고, Supabase를 백엔드 데이터베이스로 사용할 수 있습니다.

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                      사용자                              │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Netlify (CDN + Edge)                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Static Site (React/Next.js/Vue 등)             │   │
│  │  - HTML, CSS, JavaScript                        │   │
│  │  - 빌드된 프론트엔드 파일                          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Netlify Functions (Serverless)                 │   │
│  │  - API 엔드포인트                                │   │
│  │  - 인증 처리                                     │   │
│  │  - 이미지 처리                                   │   │
│  └─────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase (Backend)                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                            │   │
│  │  - 사용자 데이터                                 │   │
│  │  - SREF 코드 데이터                              │   │
│  │  - 좋아요, 댓글 등                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Supabase Auth                                  │   │
│  │  - 사용자 인증/권한 관리                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Supabase Storage                               │   │
│  │  - SREF 이미지 저장                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Realtime Subscriptions (선택)                  │   │
│  │  - 실시간 좋아요 업데이트                        │   │
│  │  - 실시간 댓글                                   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 연동 방법

### 1️⃣ 프론트엔드에서 직접 Supabase 사용 (권장)

**가장 간단한 방법!** Netlify에서 제공하는 정적 사이트에서 Supabase JS SDK를 직접 사용합니다.

#### 설치:
```bash
npm install @supabase/supabase-js
```

#### 설정 (`src/lib/supabase.js`):
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### 사용 예시:
```javascript
// 데이터 조회
const { data, error } = await supabase
  .from('sref_codes')
  .select('*')
  .eq('status', 'ACTIVE')
  .limit(20)

// 데이터 생성
const { data, error } = await supabase
  .from('sref_codes')
  .insert({
    code: 'sref-12345',
    title: 'Cool Style',
    user_id: user.id
  })

// 실시간 구독
const subscription = supabase
  .channel('sref_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'sref_codes'
  }, (payload) => {
    console.log('Change received!', payload)
  })
  .subscribe()
```

---

### 2️⃣ Netlify Functions를 미들웨어로 사용

민감한 작업(관리자 기능, 결제 등)은 Netlify Functions를 통해 처리합니다.

#### 예시 (`netlify/functions/admin-update.js`):
```javascript
import { createClient } from '@supabase/supabase-js'

export async function handler(event, context) {
  // 서버 측 Supabase 클라이언트 (service_role key 사용)
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // 주의: 서버에서만 사용!
  )

  // 요청 처리
  const { action, srefId } = JSON.parse(event.body)

  if (action === 'feature') {
    const { data, error } = await supabase
      .from('sref_codes')
      .update({ featured: true })
      .eq('id', srefId)

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    }
  }
}
```

---

## 🔐 환경 변수 설정

### Netlify 환경 변수 설정:

1. **Netlify Dashboard** → 프로젝트 선택
2. **Site settings** → **Environment variables**
3. 다음 변수 추가:

```bash
# 프론트엔드용 (Public - 브라우저에서 사용)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Functions용 (Private - 서버에서만 사용)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**중요!**
- `ANON_KEY`: 프론트엔드에서 사용 (안전, RLS로 보호됨)
- `SERVICE_ROLE_KEY`: **절대 프론트엔드에 노출 금지!** Functions에서만 사용

---

## 📦 Netlify 배포 설정

### `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"  # 또는 "build", 프레임워크에 따라 다름

[build.environment]
  NODE_VERSION = "20"

# Functions 설정
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

# 리다이렉트 설정 (SPA용)
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# CORS 헤더 (필요시)
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
```

---

## 🎯 실제 사용 예시 (sref-gallery-v3)

### 1. 프론트엔드에서 SREF 목록 가져오기:
```javascript
// src/components/SrefGallery.jsx
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function SrefGallery() {
  const [srefs, setSrefs] = useState([])

  useEffect(() => {
    async function fetchSrefs() {
      const { data, error } = await supabase
        .from('sref_codes')
        .select(`
          *,
          sref_images(*),
          categories(name, slug)
        `)
        .eq('status', 'ACTIVE')
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) setSrefs(data)
    }

    fetchSrefs()
  }, [])

  return (
    <div className="grid grid-cols-3 gap-4">
      {srefs.map(sref => (
        <SrefCard key={sref.id} sref={sref} />
      ))}
    </div>
  )
}
```

### 2. 좋아요 기능:
```javascript
async function toggleLike(srefId) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // 로그인 필요
    return
  }

  // 이미 좋아요 했는지 확인
  const { data: existing } = await supabase
    .from('likes')
    .select('id')
    .eq('sref_code_id', srefId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // 좋아요 취소
    await supabase
      .from('likes')
      .delete()
      .eq('id', existing.id)
  } else {
    // 좋아요 추가
    await supabase
      .from('likes')
      .insert({
        sref_code_id: srefId,
        user_id: user.id
      })
  }
}
```

### 3. 이미지 업로드:
```javascript
async function uploadSrefImage(file, srefId) {
  const { data: { user } } = await supabase.auth.getUser()

  // Storage에 업로드
  const fileName = `${user.id}/${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('sref-images')
    .upload(fileName, file)

  if (error) throw error

  // 공개 URL 가져오기
  const { data: { publicUrl } } = supabase.storage
    .from('sref-images')
    .getPublicUrl(fileName)

  // DB에 이미지 정보 저장
  await supabase
    .from('sref_images')
    .insert({
      sref_code_id: srefId,
      image_url: publicUrl,
      storage_path: fileName
    })

  return publicUrl
}
```

---

## ✨ 장점

### Netlify:
- ✅ 자동 배포 (Git push → 자동 빌드)
- ✅ 글로벌 CDN (빠른 로딩)
- ✅ 무료 SSL 인증서
- ✅ Serverless Functions (백엔드 API)
- ✅ 프리뷰 배포 (PR마다 테스트 사이트)

### Supabase:
- ✅ PostgreSQL (강력한 관계형 DB)
- ✅ 실시간 데이터 구독
- ✅ 내장 인증 시스템
- ✅ 파일 스토리지
- ✅ Row Level Security (데이터 보안)
- ✅ 자동 API 생성

### 조합의 장점:
- ✅ **완전 서버리스** - 서버 관리 필요 없음
- ✅ **자동 스케일링** - 트래픽 증가해도 OK
- ✅ **저렴한 비용** - 무료 티어로 시작 가능
- ✅ **빠른 개발** - 인프라 걱정 없이 개발에만 집중

---

## 💰 비용

### 무료 티어로 시작 가능:

**Netlify Free:**
- 100GB 대역폭/월
- 300분 빌드 시간/월
- Serverless Functions: 125K 요청/월

**Supabase Free:**
- 500MB 데이터베이스
- 1GB 파일 스토리지
- 50,000 월간 활성 사용자
- 2GB 대역폭

소규모~중규모 프로젝트는 무료로 충분합니다!

---

## 🚀 배포 방법

```bash
# 1. GitHub에 코드 푸시
git add .
git commit -m "Add Supabase integration"
git push origin main

# 2. Netlify에서 자동 빌드 & 배포 (1-2분)

# 3. 완료! 🎉
```

---

## 📌 요약

**네, Netlify + Supabase 조합은 완벽합니다!**

- **Netlify**: 프론트엔드 호스팅 + Functions
- **Supabase**: 데이터베이스 + 인증 + 스토리지

이 조합으로 풀스택 웹 애플리케이션을 서버 없이 만들 수 있습니다! 🚀
