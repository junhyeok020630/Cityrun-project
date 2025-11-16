// 'cityrun-redis' 컨테이너 연결 및 RedisTemplate 직렬화 방식 설정

package com.cityrun.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * @Configuration
 *                Spring의 설정 클래스임을 명시
 *                Redis 연결 및 직렬화 방법을 정의
 */
@Configuration
public class RedisConfig {

    /**
     * @Bean
     *       Redis 연결 정보를 담은 ConnectionFactory를 Spring Bean으로 등록
     * @return RedisConnectionFactory
     */
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        // "cityrun-redis" (도커 서비스 이름) 호스트의 6379 포트로 연결 설정
        return new LettuceConnectionFactory("cityrun-redis", 6379);
    }

    /**
     * @Bean
     *       Redis 데이터 조작(CRUD)을 위한 RedisTemplate을 Spring Bean으로 등록
     * @param connectionFactory 위에서 정의한 연결 팩토리
     * @return RedisTemplate<String, Object>
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        // Redis 연결 팩토리 설정
        template.setConnectionFactory(connectionFactory);
        // Redis의 Key는 일반 문자열(String)로 직렬화
        template.setKeySerializer(new StringRedisSerializer());
        // Redis의 Value는 JSON 형식(GenericJackson2Json)으로 직렬화
        // (Java 객체 -> JSON 문자열)
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}