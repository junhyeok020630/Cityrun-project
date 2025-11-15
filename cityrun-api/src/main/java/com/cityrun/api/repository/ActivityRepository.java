package com.cityrun.api.repository;

import com.cityrun.api.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {

    // '활동' 탭에서 사용할, 나의 모든 운동 기록 (최신순)
    List<Activity> findByUserIdOrderByIdDesc(Long userId);
}