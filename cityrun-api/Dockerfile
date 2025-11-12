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
# 💡 TMAP SSL 최종 해결: 호스트 이름 검증을 무시하는 JVM 옵션 추가
ENTRYPOINT ["java", "-Dcom.sun.net.ssl.checkHostname=false", "-Djsse.enableSNIExtension=false", "-jar", "app.jar"]