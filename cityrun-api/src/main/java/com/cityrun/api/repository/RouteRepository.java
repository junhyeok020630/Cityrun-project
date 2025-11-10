// src/main/java/com/cityrun/api/repository/RouteRepository.java
package com.cityrun.api.repository;

import com.cityrun.api.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByIsPublicTrue();

    List<Route> findByUserId(Long userId);
}
