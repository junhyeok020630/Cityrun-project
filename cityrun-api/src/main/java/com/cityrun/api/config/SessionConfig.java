package com.cityrun.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

@Configuration
@EnableRedisHttpSession
public class SessionConfig {

    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer cs = new DefaultCookieSerializer();
        cs.setCookieName("SESSION");
        // ★ 중요: 기본값(true)이면 응답에 Base64로 인코딩된 세션ID가 내려와서
        // Redis 키("session:<uuid>")와 불일치 → 로그인했는데 "로그인이 필요합니다."
        cs.setUseBase64Encoding(false);
        cs.setSameSite("Lax");
        cs.setUseHttpOnlyCookie(true);
        // 필요 시 도메인/패스 커스터마이즈
        // cs.setCookiePath("/");
        return cs;
    }
}
