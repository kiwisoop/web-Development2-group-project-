# web-Development2-group-project- 웹 프로그래밍 2 프로젝트

# 스포츠 분석·요약 웹 사이트

스포츠 및 e스포츠 경기 데이터를 기반으로 경기 결과, 주요 기록, 승률 분석, 경기 요약 콘텐츠를 제공하는 웹 애플리케이션입니다.

사용자는 경기 목록을 조회하고, 특정 경기의 상세 정보와 팀별 통계, 승률 분석 결과를 확인할 수 있습니다.  
또한 LLM을 활용하여 경기 데이터를 사용자가 이해하기 쉬운 문장으로 요약하는 기능을 목표로 합니다.

---

## 프로젝트 목적

본 프로젝트는 스포츠 경기 데이터를 단순히 나열하는 것이 아니라, 사용자가 쉽게 이해할 수 있도록 분석·요약하여 제공하는 것을 목표로 합니다.

주요 목적은 다음과 같습니다.

- 경기 결과 및 일정 조회
- 팀별 경기 기록 제공
- 스포츠/e스포츠 승률 분석
- 경기 주요 이벤트 및 타임라인 제공
- LLM 기반 경기 요약 및 분석 문장 제공

---

## 주요 기능

### 1. 사용자 기능

- 회원가입
- 로그인
- 사용자별 관심 팀 관리

### 2. 경기 정보 기능

- 경기 목록 조회
- 경기 상세 정보 조회
- 팀별 경기 기록 조회
- 경기 결과 조회

### 3. 승률 분석 기능

- 두 팀 간 승률 예측
- 전체 승률 기반 분석
- 최근 경기 흐름 분석
- 세트 승률 기반 e스포츠 분석
- 전력 점수 계산
- 분석 요약 문장 제공

### 4. 경기 요약 기능

- 경기 주요 이벤트 제공
- 경기 타임라인 제공
- LLM을 활용한 경기 요약 문장 생성

---

## e스포츠 승률 분석 방식

본 프로젝트에서는 초기 개발 범위로 e스포츠, 특히 LoL 경기 데이터를 기준으로 승률 분석 기능을 구현합니다.

승률 분석에는 다음 요소를 반영합니다.

- 전체 경기 승률
- 최근 5경기 승률
- 세트 승률
- 팀별 전력 점수

기술 스택
Frontend
HTML
CSS
JavaScript

프로젝트 구조
Backendsrc/main/java/com/example/sports
 ┣ controller
 ┃ ┣ TeamController.java
 ┃ ┣ MatchController.java
 ┃ ┗ EsportPredictionController.java
 ┣ service
 ┃ ┣ TeamService.java
 ┃ ┣ MatchService.java
 ┃ ┗ EsportPredictionService.java
 ┣ repository
 ┃ ┣ TeamRepository.java
 ┃ ┣ MatchRepository.java
 ┃ ┗ EsportMatchRepository.java
 ┣ entity
 ┃ ┣ Team.java
 ┃ ┣ Match.java
 ┃ ┣ EsportTeam.java
 ┃ ┗ EsportMatch.java
 ┣ dto
 ┃ ┣ TeamResponse.java
 ┃ ┣ MatchResponse.java
 ┃ ┗ EsportPredictionResponse.java
 ┗ SportsApplication.java
Java
Spring Boot
Spring Web
Spring Data JPA
Database
MySQL 또는 Oracle DB
Collaboration
Git
GitHub

+ 최근 5경기 승률 * 30
+ 세트 승률 * 20
