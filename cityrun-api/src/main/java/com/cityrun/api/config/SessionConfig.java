// Redis를 이용한 HTTP 세션 공유(@EnableRedisHttpSession) 및 세션 쿠키 설정

package com.cityrun.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

/**
 * @Configuration
 *                Spring의 설정 클래스임을 명시
 */
@Configuration
/**
 * @EnableRedisHttpSession
 *                         Spring Session이 Redis를 세션 저장소로 사용하도록 활성화
 *                         (과제 '세션 공유' 요건)
 */
@EnableRedisHttpSession
public class SessionConfig {

    /**
     * @Bean
     *       세션 쿠키의 동작 방식을 정의하는 CookieSerializer를 Bean으로 등록
     * @return CookieSerializer
     */
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer cs = new DefaultCookieSerializer();

        // 1. 쿠키 이름을 'SESSION'으로 설정 (Spring Session의 기본값)
        cs.setCookieName("SESSION");

        // 2. (중요) Base64 인코딩 비활성화
        // (true가 기본값이면 브라우저 쿠키와 Redis 키(예: session:<uuid>)가 불일치하여 세션 조회 실패)
        cs.setUseBase64Encoding(false);

        // 3. SameSite 정책을 'Lax'로 설정 (CSRF 공격 방어)
        cs.setSameSite("Lax");

        // 4. HttpOnly 플래그 설정 (JavaScript의 쿠키 접근 방지)
        cs.setUseHttpOnlyCookie(true);

        // cs.setCookiePath("/");
        return cs;
    }
}