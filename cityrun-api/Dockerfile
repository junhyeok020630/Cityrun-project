# 'cityrun-api' (Spring Boot) 서버를 빌드하고 실행하기 위한 Dockerfile

# --- 1. 빌드(Build) 단계 ---
# 'builder'라는 이름의 빌드 환경을 정의
# gradle:8.10-jdk17 이미지를 기반으로 함 (Java 17과 Gradle 8.10 포함)
FROM gradle:8.10-jdk17 AS builder
WORKDIR /app

# Gradle 의존성 캐싱을 위해 build.gradle, settings.gradle, gradle/ 디렉토리 먼저 복사
COPY build.gradle settings.gradle ./
COPY gradle/ ./gradle/
# --no-daemon: Gradle 데몬을 사용하지 않고 의존성만 다운로드 (Docker 캐시 활용)
RUN gradle dependencies --no-daemon

# 나머지 소스 코드를 모두 /app 디렉토리로 복사
COPY . .

# --no-daemon: Gradle 데몬을 사용하지 않고 Spring Boot 애플리케이션을 .jar 파일로 빌드
RUN gradle clean bootJar --no-daemon

# --- 2. 실행(Runtime) 단계 ---
# 'eclipse-temurin:17-jre' 이미지를 기반으로 함 (Java 17 JRE만 포함되어 용량이 가벼움)
FROM eclipse-temurin:17-jre
WORKDIR /app

# 'builder' 단계(Stage 1)에서 생성된 .jar 파일을 현재 실행 단계로 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 8080 포트를 외부에 노출 (application.properties의 server.port와 일치)
EXPOSE 8080

# 컨테이너가 시작될 때 실행할 최종 명령어
# java [JVM 옵션] -jar app.jar
# (참고) -Dcom.sun.net.ssl.checkHostname=false 등은 SSL 관련 옵션
ENTRYPOINT ["java", "-Dcom.sun.net.ssl.checkHostname=false", "-Djsse.enableSNIExtension=false", "-jar", "app.jar"]