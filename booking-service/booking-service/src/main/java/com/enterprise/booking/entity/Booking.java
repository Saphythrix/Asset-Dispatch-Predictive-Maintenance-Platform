package com.enterprise.booking.entity;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID assetId;

    @Column(nullable = false)
    private UUID clientCompanyId;

    @Column(nullable = false)
    private UUID createdBy;

    @Column(nullable = false)
    private LocalDateTime slotStart;

    @Column(nullable = false)
    private LocalDateTime slotEnd;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column
    @Builder.Default
    private Double hourlyRateSnapshot = 100.0;

    @Column
    @Builder.Default
    private Double baseCost = 0.0;

    @Column
    private Double actualHoursUsed;

    @Column
    @Builder.Default
    private Double overtimeHours = 0.0;

    @Column
    @Builder.Default
    private Double overtimeCost = 0.0;

    @Column
    @Builder.Default
    private Double totalCost = 0.0;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = BookingStatus.PENDING;
        }
    }
}