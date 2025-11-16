// 'cityrun-geo' 서비스와 통신하기 위한 WebClient Bean 설정

package com.cityrun.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;
import java.time.Duration;

/**
 * @Configuration
 *                Spring의 설정 클래스임을 명시
 *                WebClient 관련 Bean 정의
 */
@Configuration
public class WebClientConfig {

        /**
         * 'geoWebClient'라는 이름의 WebClient Bean을 등록
         * 이 Bean은 'cityrun-geo' Node.js 서버와 통신하는 데 사용
         * 
         * @return WebClient
         */
        @Bean
        public WebClient geoWebClient() {
                // 60초 타임아웃 설정이 적용된 HttpClient 객체 생성
                HttpClient httpClient = HttpClient.create()
                                .responseTimeout(Duration.ofSeconds(60));

                // WebClient 빌더를 사용하여 WebClient 인스턴스 생성
                return WebClient.builder()
                                // 기본 URL 설정: 'cityrun-geo' (도커 서비스 이름)의 3000번 포트
                                .baseUrl("http://cityrun-geo:3000")
                                // 위에서 설정한 60초 타임아웃 HttpClient를 WebClient에 적용
                                .clientConnector(new ReactorClientHttpConnector(httpClient))
                                .build();
        }
}