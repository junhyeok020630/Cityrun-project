package com.cityrun.api.repository;

import com.cityrun.api.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {

    // UserRoutesController에서 호출하는 정렬 버전 (없어서 컴파일 에러 났음)
    List<Route> findByIsPublicTrueOrderByIdDesc();

    List<Route> findByUserIdOrderByIdDesc(Long userId);
}
