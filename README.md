# c1oud-mall-frontend
c1oud-mall 프론트입니다. 

# c1oud-mall-frontend 로컬 실행 가이드

처음 레포를 받아서 `npm run dev`로 띄우기까지의 과정입니다.
**라이브러리를 하나씩 직접 받을 필요 없습니다.** `npm install` 한 번이면 `package.json` / `package-lock.json`에 정의된 의존성이 전부 자동으로 설치됩니다.

---

## 1. 사전 준비물 (한 번만 설치)

| 도구 | 권장 버전 | 확인 명령어 |
|------|-----------|-------------|
| **Node.js** | 22 LTS 이상 (최소 20.19+) | `node -v` |
| **npm** | Node 설치 시 같이 들어옴 | `npm -v` |
| **Git** | 최신 | `git --version` |

> 이 프로젝트는 Vite 8 / TypeScript 6 / `@types/node 24` 기준이라 Node는 **22 LTS 이상**을 권장합니다.
> 여러 Node 버전을 오가야 하면 [nvm](https://github.com/nvm-sh/nvm) (mac/linux) 또는 [nvm-windows](https://github.com/coreybutler/nvm-windows) 사용을 추천합니다.

---

## 2. 레포 클론

```bash
git clone https://github.com/nbc-team-c1oud/c1oud-mall-frontend.git
cd c1oud-mall-frontend
```

---

## 3. 의존성 설치

```bash
npm install
```

- `package.json`과 `package-lock.json`을 읽어 필요한 라이브러리를 **자동으로 전부** 받습니다.
- 끝나면 `node_modules/` 폴더가 생깁니다. (이 폴더는 `.gitignore`에 있어서 커밋되지 않습니다.)
- 팀 전체가 동일한 버전을 쓰도록 `npm install` 대신 `npm ci`를 쓰는 것도 좋습니다. (lock 파일 기준으로 깨끗하게 설치)

---

## 4. 개발 서버 실행

```bash
npm run dev
```

실행되면 터미널에 아래처럼 주소가 뜹니다. 브라우저로 접속하면 됩니다.

```
  ➜  Local:   http://localhost:5173/
```

> Vite 기본 포트는 **5173**입니다. 종료는 터미널에서 `Ctrl + C`.

---

## 5. 자주 쓰는 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 실행 (핫 리로드) |
| `npm run build` | 타입 체크(`tsc -b`) 후 프로덕션 빌드 (`dist/` 생성) |
| `npm run preview` | 빌드 결과물을 로컬에서 미리보기 |
| `npm run lint` | ESLint 검사 |

---

## 6. 설치된 주요 의존성 (참고용 — 직접 설치 X)

`npm install`이 알아서 받으므로 외울 필요 없고, 어떤 스택인지 참고만 하세요.

**런타임 (dependencies)**
- `react`, `react-dom` — React 19

**개발 도구 (devDependencies)**
- `vite`, `@vitejs/plugin-react` — 번들러 / 개발 서버
- `typescript`, `typescript-eslint` — 타입스크립트
- `eslint`, `@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `globals` — 린트
- `@types/node`, `@types/react`, `@types/react-dom` — 타입 정의

---

## 7. 문제 해결 (Troubleshooting)

- **`npm install`이 권한/네트워크로 실패** → 사내망/프록시 환경이면 npm registry 접근이 막혔는지 확인.
- **포트 5173이 이미 사용 중** → 다른 프로세스가 점유 중. `npm run dev -- --port 3000`처럼 포트 변경 가능.
- **타입 에러로 `npm run build` 실패** → `tsc -b`가 먼저 도므로 타입 오류부터 해결해야 빌드됨. 개발 중에는 `npm run dev`만 써도 됩니다.
- **node_modules가 꼬였을 때** → 폴더와 lock 충돌 정리 후 재설치:
  ```bash
  rm -rf node_modules
  npm install
  ```
  (Windows PowerShell: `Remove-Item -Recurse -Force node_modules`)
- **Node 버전이 낮아 실행 안 됨** → `node -v`로 확인하고 22 LTS 이상으로 업데이트.

---

### 한 줄 요약

```bash
git clone https://github.com/nbc-team-c1oud/c1oud-mall-frontend.git
cd c1oud-mall-frontend
npm install
npm run dev
```
