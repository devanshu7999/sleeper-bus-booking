# Sleeper Bus Ticket Booking System

A full-stack web application for booking sleeper bus tickets from **Ahmedabad to Mumbai**, featuring seat selection (Upper/Lower), meal selection, passenger details, booking management, cancellation, and ML-based booking confirmation prediction.

## Features:

### 1. Journey Selection
- Select **boarding** and **dropping** stations
- Validation to ensure correct travel order

### 2. Seat Selection
- Sleeper bus layout with:
  - Upper (U) and Lower (L) berths
- Real-time seat availability
- Booked seats are disabled
- Multiple seat selection supported

### 3. Meal Selection (Optional)
- Veg / Non-Veg / Breakfast / Snacks
- Meal cost added dynamically to total fare

### 4. Passenger Details
- Separate form for each selected seat
- Fields:
  - Name
  - Age
  - Gender
  - Phone
  - Email

### 5. Booking Summary
- Route details
- Seats selected
- Meal details
- Seat fare + Meal fare
- Final payable amount

### 6. ML-Based Confirmation Prediction
- Predicts **booking confirmation probability (%)**
- Factors used:
  - Seat count
  - Seat type (Upper/Lower)
  - Boarding & Dropping stations
  - Booking time & day
  - Meal selection
  - Total amount

### 7. Booking Management
- View all bookings
- Booking status (Confirmed / Cancelled)
- Cancel booking with seat release
- Refund amount shown on cancellation

### 8. REST API Support
- `/api/stations`
- `/api/seats`
- `/api/meals`
- `/api/book`
- `/api/bookings`
- `/api/cancel/<booking_id>`
- `/api/predict`

---

## Test Cases:

### Test Case 1: Station Selection
**Input:** Boarding = Ahmedabad, Dropping = Mumbai  
**Expected Result:** User can proceed to seat selection  

### Test Case 2: Invalid Route
**Input:** Boarding = Mumbai, Dropping = Ahmedabad  
**Expected Result:** Error message shown  

### Test Case 3: Seat Selection
**Input:** Select available seats (e.g., 3U, 4L)  
**Expected Result:** Seats marked as selected  

### Test Case 4: Booked Seat Click
**Input:** Click on already booked seat  
**Expected Result:** No action taken  

### Test Case 5: Passenger Details Validation
**Input:** Missing passenger details  
**Expected Result:** Form validation error  

### Test Case 6: Booking Confirmation
**Input:** Valid journey + seat + passenger details  
**Expected Result:** Booking confirmed & Booking ID generated  

### Test Case 7: View Bookings
**Action:** Click "View Bookings"  
**Expected Result:** All bookings displayed with status  

### Test Case 8: Cancel Booking
**Action:** Cancel a confirmed booking  
**Expected Result:**  
- Status changed to `Cancelled`  
- Seats become available again  

### Test Case 9: Prediction API
**Input:** Booking data  
**Expected Result:** Confirmation probability (%) returned  

---

## Prototype Link:


