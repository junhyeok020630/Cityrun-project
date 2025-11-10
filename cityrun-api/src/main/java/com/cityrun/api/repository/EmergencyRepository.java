package com.cityrun.api.repository;

import com.cityrun.api.entity.Emergency;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmergencyRepository extends JpaRepository<Emergency, Long> {}
