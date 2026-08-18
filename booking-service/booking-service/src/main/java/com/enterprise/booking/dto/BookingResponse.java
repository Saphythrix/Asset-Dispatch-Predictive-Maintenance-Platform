package com.enterprise.booking.dto;


import com.enterprise.booking.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private UUID id;
    private UUID assetId;
    private UUID clientCompanyId;
    private UUID createdBy;
    private LocalDateTime slotStart;
    private LocalDateTime slotEnd;
    private BookingStatus status;
    private LocalDateTime createdAt;
}