package com.enterprise.booking.controller;

import com.enterprise.booking.dto.BookingResponse;
import com.enterprise.booking.dto.CreateBookingRequest;
import com.enterprise.booking.entity.BookingStatus;
import com.enterprise.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/bookings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request));
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @GetMapping("/asset/{assetId}")
    public ResponseEntity<List<BookingResponse>> getBookingsByAsset(@PathVariable UUID assetId) {
        return ResponseEntity.ok(bookingService.getBookingsByAsset(assetId));
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<BookingResponse>> getBookingsByCompany(@PathVariable UUID companyId) {
        return ResponseEntity.ok(bookingService.getBookingsByCompany(companyId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BookingResponse> updateBookingStatus(
            @PathVariable UUID id,
            @RequestParam BookingStatus status,
            @RequestParam(required = false) Double actualHoursUsed) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(id, status, actualHoursUsed));
    }
}