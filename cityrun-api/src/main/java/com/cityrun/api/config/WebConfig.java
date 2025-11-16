// Spring Web MVC 설정: 전역 CORS(Cross-Origin Resource Sharing) 정책 정의

package com.cityrun.api.config;

// import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

/**
 * @Configuration
 *                Spring의 설정 클래스임을 명시
 *                WebMvcConfigurer를 구현하여 Spring MVC의 설정을 커스터마이징
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * CORS (Cross-Origin Resource Sharing) 설정을 전역적으로 추가
     *
     * @param reg CORS 설정 레지스트리
     */
    @Override
    public void addCorsMappings(CorsRegistry reg) {
        // "/**" : 모든 경로에 대해 CORS 정책 적용
        reg.addMapping("/**")
                // allowedOrigins("*") : 모든 Origin(출처)의 요청을 허용
                // (보안이 중요하다면 "http://localhost:3000" 등으로 특정)
                .allowedOrigins("*")
                // 허용할 HTTP 메서드 (GET, POST, PUT, DELETE 등)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                // allowCredentials(false) : 쿠키, 인증 헤더 등을 포함한 요청 허용 안 함
                // (true로 할 경우 allowedOrigins("*")는 사용 불가)
                .allowCredentials(false)
                // maxAge(3600) : Preflight 요청의 캐시 시간 (3600초 = 1시간)
                .maxAge(3600);
    }
}