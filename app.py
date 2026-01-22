from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime
import pandas as pd
import pickle
import os

app = Flask(__name__)
CORS(app)

# In-memory storage
with open("model/Sleeper_Booking.pkl", "rb") as f:
    model = pickle.load(f)

bookings = []
booked_seats = ['5U', '12U', '18L', '25L', '29L']  # Pre-booked seats

# Station data
stations = [
    {"id": 1, "name": "Ahmedabad", "time": "10:00 PM", "price": 50},
    {"id": 2, "name": "Nadiad", "time": "11:00 PM", "price": 150},
    {"id": 3, "name": "Vadodara", "time": "12:30 AM", "price": 200},
    {"id": 4, "name": "Surat", "time": "02:00 AM", "price": 400},
    {"id": 5, "name": "Mumbai", "time": "06:00 AM", "price": 800}
]

# Meal options
meals = [
    {"id": 1, "name": "Vegetarian Combo", "description": "Rice, Dal, Roti, Sabji, Sweet", "price": 150},
    {"id": 2, "name": "Non-Veg Combo", "description": "Rice, Chicken Curry, Roti, Salad", "price": 200},
    {"id": 3, "name": "Breakfast Special", "description": "Poha, Tea, Banana", "price": 100},
    {"id": 4, "name": "Snack Box", "description": "Sandwich, Chips, Cold Drink", "price": 120}
]

@app.route("/")
def home():
    return render_template("index.html")

@app.route('/api/stations', methods=['GET'])
def get_stations():
    """Get list of all stations"""
    return jsonify({
        "success": True,
        "stations": stations
    })

@app.route('/api/seats', methods=['GET'])
def get_seats():
    """Get seat availability with U (Upper) and L (Lower) labels"""
    total_seats = 32  # 16 Upper, 16 Lower

    # Generate all seat labels
    all_seat_labels = []
    for i in range(1, 17):  # 1-16 for Upper
        all_seat_labels.append(f"{i}U")
    for i in range(1, 17):  # 1-16 for Lower
        all_seat_labels.append(f"{i}L")

    available_seats = []
    booked_seat_labels = []

    for label in all_seat_labels:
        if label in booked_seats:
            booked_seat_labels.append(label)
        else:
            available_seats.append(label)
    
    return jsonify({
        "success": True,
        "total_seats": total_seats,
        "available_seats": available_seats,
        "booked_seats": booked_seat_labels,
        "available_count": len(available_seats)
    })



@app.route('/api/meals', methods=['GET'])
def get_meals():
    """Get available meal options"""
    return jsonify({
        "success": True,
        "meals": meals
    })


@app.route('/api/book', methods=['POST'])
def book_seats():
    """Book seats and meals"""
    data = request.get_json()
    
    # Validate seats availability
    selected_seats = data.get('selectedSeats', [])
    for seat in selected_seats:
        if seat in booked_seats:
            return jsonify({
                "success": False,
                "message": f"Seat {seat} is already booked"
            }), 400
    
    # Generate booking ID
    booking_id = f"BK{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    total_price = data.get('total_amount',0)
    
    # Create booking
    booking = {
        "booking_id": booking_id,
        "boarding_point": data['boardingPoint'],
        "dropping_point": data['droppingPoint'],
        "seats": selected_seats,
        "meals": data.get('selectedMeals', []),
        "passengers": data.get('passengers', []),
        "total_price": total_price,
        "booking_time": datetime.now().isoformat(),
        "status": "confirmed"
    }
    
    bookings.append(booking)
    
    # Mark seats as booked
    booked_seats.extend(selected_seats)
    
    return jsonify({
        "success": True,
        "booking_id": booking_id,
        "total_price": total_price,
        "message": "Booking confirmed successfully"
    })


@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    """Get all bookings"""
    bookings_with_details = []
    
    for booking in bookings:
        boarding_station = next((s for s in stations if s['id'] == booking['boarding_point']), None)
        dropping_station = next((s for s in stations if s['id'] == booking['dropping_point']), None)
        
        # Get first passenger details
        first_passenger = booking['passengers'][0] if booking['passengers'] else None
        passenger_name = first_passenger['name'] if first_passenger else 'N/A'
        passenger_contact = first_passenger['phone'] if first_passenger else 'N/A'
        
        bookings_with_details.append({
            "booking_id": booking['booking_id'],
            "boarding": boarding_station['name'] if boarding_station else 'N/A',
            "dropping": dropping_station['name'] if dropping_station else 'N/A',
            "seats": booking['seats'],
            "passenger_name": passenger_name,
            "passenger_contact": passenger_contact,
            "total_amount": booking['total_price'],
            "booking_time": booking['booking_time'],
            "status": booking['status']
        })
    
    return jsonify({
        "success": True,
        "bookings": bookings_with_details
    })


@app.route('/api/cancel/<booking_id>', methods=['DELETE'])
def cancel_booking(booking_id):
    """Cancel a booking"""
    booking = next((b for b in bookings if b['booking_id'] == booking_id), None)
    
    if not booking:
        return jsonify({
            "success": False,
            "message": "Booking not found"
        }), 404
    
    if booking['status'] == 'cancelled':
        return jsonify({
            "success": False,
            "message": "Booking already cancelled"
        }), 400
    
    # Free up seats
    for seat in booking['seats']:
        if seat in booked_seats:
            booked_seats.remove(seat)
    
    # Update booking status
    booking['status'] = 'cancelled'
    booking['cancelled_at'] = datetime.now().isoformat()
    
    return jsonify({
        "success": True,
        "message": "Booking cancelled successfully",
        "refund_amount": booking['total_price']
    })


@app.route('/api/booking/<booking_id>', methods=['GET'])
def get_booking(booking_id):
    """Get booking details"""
    booking = next((b for b in bookings if b['booking_id'] == booking_id), None)
    
    if not booking:
        return jsonify({
            "success": False,
            "message": "Booking not found"
        }), 404
    
    return jsonify({
        "success": True,
        "booking": booking
    })


@app.route('/api/predict', methods=['POST'])
def predict_confirmation():
    """
    Predict booking confirmation probability using ML model
    Based on historical patterns and current booking parameters
    """
    data = request.get_json()
    
    # Extract data from request
    selected_seats = data.get('selectedSeats', [])
    boarding_point = data.get('boardingPoint')
    dropping_point = data.get('droppingPoint')
    selected_meals = data.get('selectedMeals', [])
    total_amount = data.get('totalAmount', 0)
    
    # Validate we have seats
    if not selected_seats or len(selected_seats) == 0:
        return jsonify({
            "success": False,
            "message": "No seats selected"
        }), 400
    
    # Get current time for journey features
    now = datetime.now()
    journey_day_of_week = now.weekday()  # 0=Monday, 6=Sunday
    booking_hour = now.hour
    
    # Prepare data for all seats
    seat_data = []
    for seat_label in selected_seats:
        # Encode seat type: U=1, L=0 (or use your model's encoding)
        seat_type = 'upper' if seat_label[-1] == 'U' else 'lower'
        
        seat_data.append({
            'seat_count': len(selected_seats),
            'seat_type': seat_type,
            'boarding_station': boarding_point,
            'dropping_station': dropping_point,
            'journey_day_of_week': journey_day_of_week,
            'booking_hour': booking_hour,
            'has_meal': 1 if len(selected_meals) > 0 else 0,
            'total_amount': total_amount
        })
    
    model_input = {
        'seat_count': seat_data[0]['seat_count'],
        'seat_type': seat_data[0]['seat_type'],
        'boarding_station': seat_data[0]['boarding_station'],
        'dropping_station': seat_data[0]['dropping_station'],
        'journey_day_of_week': seat_data[0]['journey_day_of_week'],
        'booking_hour': seat_data[0]['booking_hour'],
        'has_meal': seat_data[0]['has_meal'],
        'total_amount': seat_data[0]['total_amount']
    }
    df = pd.DataFrame([model_input])
        
    # Load the ML model
    try:
        if model:
            prediction_proba = model.predict(df)[0]
            # Get probability of confirmation (assuming class 1 is confirmed)            
            confirmation_probability = prediction_proba
            print(f"[v0] Model prediction: {confirmation_probability}%")
    
    except Exception as e:
        print(f"[v0] Error loading/using model: {str(e)}")
        # Fallback prediction on error
    
    
    # Determine message based on probability
    if confirmation_probability >= 90:
        message = "Excellent! Very high probability of confirmation"
    elif confirmation_probability >= 80:
        message = "Good! High probability of confirmation"
    elif confirmation_probability >= 70:
        message = "Moderate probability of confirmation"
    else:
        message = "Lower probability - consider alternative options"
    
    return jsonify({
        "success": True,
        "prediction_percentage": round(confirmation_probability, 2),
        "message": message,
        "factors": {
            "seat_count": len(selected_seats),
            "seat_type": seat_data[0]['seat_type'],
            "boarding_station": boarding_point,
            "dropping_station": dropping_point,
            "journey_day_of_week": journey_day_of_week,
            "booking_hour": booking_hour,
            "has_meal": len(selected_meals) > 0,
            "total_amount": total_amount
        }
    })


@app.route('/api/availability', methods=['GET'])
def check_availability():
    """Check seat availability for specific route"""
    boarding = request.args.get('boarding', type=int)
    dropping = request.args.get('dropping', type=int)
    
    if not boarding or not dropping:
        return jsonify({
            "success": False,
            "message": "Boarding and dropping points required"
        }), 400
    
    total_seats = 40
    available_count = total_seats - len(booked_seats)
    
    boarding_station = next((s for s in stations if s['id'] == boarding), None)
    dropping_station = next((s for s in stations if s['id'] == dropping), None)
    
    if not boarding_station or not dropping_station:
        return jsonify({
            "success": False,
            "message": "Invalid station"
        }), 400
    
    price_per_seat = dropping_station['price'] - boarding_station['price']
    
    return jsonify({
        "success": True,
        "available_seats": available_count,
        "price_per_seat": price_per_seat,
        "route": f"{boarding_station['name']} to {dropping_station['name']}"
    })


application = app

# Local debug server (not used by Gunicorn)
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=8080)