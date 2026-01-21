## 🧠 Prediction Logic

The prediction system works as follows:

1. User selects:
   - Seats (Upper / Lower)
   - Boarding & Dropping stations
   - Meals (optional)
2. System extracts booking features:
   - Number of seats
   - Seat type (Upper / Lower)
   - Boarding station
   - Dropping station
   - Day of week
   - Booking hour
   - Meal selection
   - Total booking amount
3. Features are passed to a trained ML model.
4. Model outputs a **booking confirmation probability (%)**.
5. Probability is displayed to the user with an interpretation message.

---

## Features Used for Prediction

| Feature Name | Description |
|-------------|------------|
| seat_count | Total seats selected |
| seat_type | Upper or Lower berth |
| boarding_station | Source location |
| dropping_station | Destination |
| journey_day_of_week | Day (0 = Monday, 6 = Sunday) |
| booking_hour | Hour of booking (0–23) |
| has_meal | Meal selected (1 = Yes, 0 = No) |
| total_amount | Final booking cost |

---

## Model Choice

**Model Used:**  
- LinearRegression  
- Stored as a Pickle file (`Sleeper_Booking.pkl`)

**Why this model?**
- Works well with structured tabular data
- Fast inference time
- Easy deployment with Flask
- Suitable for probability-based predictions

> The model predicts a numerical probability representing booking success likelihood.

---

## Mock Dataset

Since real-world booking data may not be available initially, a **synthetic (mock) dataset** was created.

### Sample Dataset Structure

| seat_count | seat_type | boarding_station | dropping_station | day | hour | has_meal | total_amount | confirmation |
|-----------|----------|------------------|------------------|-----|------|----------|--------------|--------------|
| 2 | upper | Ahmedabad | Mumbai | 4 | 20 | 1 | 1900 | 1 |
| 1 | lower | Vadodara | Surat | 2 | 10 | 0 | 400 | 0 |
| 3 | upper | Ahmedabad | Surat | 5 | 22 | 1 | 1800 | 1 |

**Target Variable:**  
- `confirmation` (1 = Confirmed, 0 = Not Confirmed)

---

##  Training Methodology

1. Generate mock historical booking data
2. Encode categorical features (seat type, stations)
3. Split dataset:
   - Training set
   - Testing set
4. Train ML model using supervised learning
5. Evaluate using accuracy and probability outputs
6. Save trained model as `.pkl` file
7. Load model in Flask backend for real-time prediction

---

## Booking Probability Output (%)

### Output Format

```json
{
  "success": true,
  "prediction_percentage": 87.45,
  "message": "High probability of confirmation"
}
