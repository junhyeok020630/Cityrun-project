package com.cityrun.api.config;

// 불필요한 import 구문 제거 (SSL 관련)
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    // Geo Engine WebClient (기존 유지)
    @Bean
    public WebClient geoWebClient() {
        return WebClient.builder()
                .baseUrl("http://cityrun-geo:3000")
                .build();
    }

    // 💡 TMAP API WebClient (간소화: 컴파일 오류 해결 목적)
    @Bean
    public WebClient tmapWebClient() {
        // TMAP SSL Handshake 예외 해결을 위한 복잡한 Netty/Reactor 코드를 제거하고
        // 컴파일 오류를 해결하기 위해 가장 간단한 WebClient를 반환합니다.

        // 이로 인해 TMAP 호출 시 SSL 오류(SSLHandshakeException)가 재발할 수 있습니다.
        // 만약 재발한다면, TMAP API의 인증서 문제를 해결하기 위한 최종적인 JVM 설정을 해야 합니다.
        return WebClient.builder().build();
    }
}