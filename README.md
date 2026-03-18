# NexTalk - Frontend (React & TypeScript)

React와 TypeScript를 활용하여 구축한 실시간 채팅 서비스의 프론트엔드 레포지토리입니다. 
Vercel을 통해 지속적 통합 및 배포(CI/CD) 환경을 구성하였으며, 보안 통신을 위해 HTTPS 환경에서 운영됩니다.

## 1. 프로젝트 개요
- 개발 기간: 2026.03.09 ~ 2026.03.18 (1주)
- 주요 기술: React, TypeScript, Vite, Axios, StompJS
- 배포 환경: Vercel (HTTPS)

## 2. 주요 기능
- WebSocket(STOMP)을 이용한 실시간 채팅 인터페이스
- JWT(JSON Web Token) 기반 사용자 인증 및 토큰 관리
- Axios Interceptor를 활용한 API 통신 인가 처리
- 반응형 웹 디자인 적용 (Bootstrap 기반)

## 3. 트러블슈팅: Mixed Content 에러 해결
- 문제: HTTPS 환경의 프론트엔드에서 HTTP 백엔드 API 호출 시 브라우저 보안 정책에 의해 통신이 차단됨
- 해결: 백엔드 서버(Oracle Cloud) 앞단에 Nginx를 배치하고 SSL 인증서(Certbot)를 적용하여 프론트-백엔드 간 통신 프로토콜을 HTTPS로 일치시킴


