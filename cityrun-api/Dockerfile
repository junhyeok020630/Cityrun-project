FROM gradle:8.10-jdk17 AS builder
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle/ ./gradle/
RUN gradle dependencies --no-daemon
COPY . .
RUN gradle clean bootJar --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
# 💡 최종 SSL 해결: JVM 옵션 추가
# -Dcom.sun.net.ssl.checkHostname=false 플래그를 사용하여 SSL 호스트 이름 검증을 비활성화합니다.
ENTRYPOINT ["java", "-Dcom.sun.net.ssl.checkHostname=false", "-jar", "app.jar"]