package com.enterprise.booking.repository;



import com.enterprise.booking.entity.Booking;
import com.enterprise.booking.entity.BookingStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    @Lock(LockModeType.PESSIMISTIC_READ)//When I'm reading these matching booking rows, lock them so other transactions can't freely modify them while I'm working
    @Query("""
        SELECT b FROM Booking b 
        WHERE b.assetId = :assetId 
        AND b.status = :status 
        AND (b.slotStart < :slotEnd AND b.slotEnd > :slotStart)
    """)
    List<Booking> findOverlappingBookings(
            @Param("assetId") UUID assetId,
            @Param("status") BookingStatus status,
            @Param("slotStart") LocalDateTime slotStart,
            @Param("slotEnd") LocalDateTime slotEnd
    );

    List<Booking> findByAssetId(UUID assetId);

    List<Booking> findByClientCompanyId(UUID clientCompanyId);
}