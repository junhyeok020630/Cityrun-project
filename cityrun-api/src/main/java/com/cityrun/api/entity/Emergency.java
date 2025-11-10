package com.cityrun.api.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "emergency_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Emergency {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private Double lat;
    private Double lng;
    private String status;
}
