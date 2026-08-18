package com.enterprise.maintenance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "work_order_state_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrderStateLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID workOrderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderState fromState;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderState toState;

    @Column(nullable = false)
    private LocalDateTime transitionedAt;
}