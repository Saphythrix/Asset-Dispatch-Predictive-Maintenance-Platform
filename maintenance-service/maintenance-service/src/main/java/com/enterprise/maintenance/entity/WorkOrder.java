package com.enterprise.maintenance.entity;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "work_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID assetId;

    @Column
    private UUID bookingId; // Nullable (if triggered by scheduled maintenance)

    @Column
    private UUID technicianId; // Nullable initially

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WorkOrderState state;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.state == null) {
            this.state = WorkOrderState.CREATED;
        }
    }
}