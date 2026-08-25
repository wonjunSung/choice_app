# rental-status

a~e 항목의 이용가능 / 이용중 상태를 공유하는 간단한 Node 앱입니다.

## 로컬 실행

```bash
npm install
npm start
```

브라우저에서 http://localhost:3000

## Render 배포

1. 이 저장소를 GitHub에 push
2. Render → New → Web Service
3. 저장소 연결
4. 설정:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Free 플랜으로 Create Web Service
