# FORMULATE

건축 논문과 설계 개념을 OpenAI Responses API로 분석하고, 핵심 개념과 관계를 React Flow 다이어그램으로 시각화하는 배포 가능한 Next.js 15 웹 앱입니다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local
# .env.local에 OPENAI_API_KEY 입력
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. API 키가 없어도 예시 다이어그램 편집과 PNG 저장은 사용할 수 있습니다.

## Vercel에 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

1. 이 저장소를 GitHub에 푸시합니다.
2. [Vercel](https://vercel.com/new)에서 저장소를 Import합니다.
3. 프로젝트의 **Settings → Environment Variables**에 아래 변수를 추가합니다.
4. Deploy를 실행하고, 생성된 도메인을 `NEXT_PUBLIC_SITE_URL`에 입력한 뒤 재배포합니다.

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `OPENAI_API_KEY` | 예 | 서버에서만 사용하는 OpenAI API 키 |
| `OPENAI_MODEL` | 아니오 | 기본값 `gpt-5.4-mini` |
| `NEXT_PUBLIC_SITE_URL` | 권장 | 메타데이터, sitemap에 사용할 배포 URL |

> `OPENAI_API_KEY`에는 `NEXT_PUBLIC_` 접두사를 붙이지 마세요. 브라우저에 API 키가 노출됩니다.

## 배포 전 확인

```bash
npm run typecheck
npm run build
npm start
```

배포 후 `/robots.txt`, `/sitemap.xml`, `/api/analyze` 및 PNG 다운로드를 확인하세요. OpenAI 사용량과 비용 보호를 위해 공개 서비스에서는 Vercel Firewall 또는 별도 rate limit을 설정하는 것을 권장합니다.

## 주요 기능

- OpenAI Responses API Structured Outputs 기반 핵심 개념·관계 추출
- React Flow 기반 편집 가능한 관계 다이어그램
- 논문에 적합한 흑백 편집 디자인과 반응형 홈페이지
- 브라우저에서 고해상도 PNG 다운로드
- 배포용 SEO 메타데이터, favicon, robots.txt, sitemap.xml
