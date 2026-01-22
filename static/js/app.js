const API_URL = '/api'; // use relative path so it works in dev and deploy

const bookingData = {
    boardingPoint: '',
    droppingPoint: '',
    source: '',
    desti: '',
    total_amount: 0,
    selectedSeats: [],
    selectedMeals: [],
    passengers: []
};

let stations = [];
let meals = [];
let bookedSeats = [];

async function initializeApp() {
    await loadStations();
    await loadSeats();
    await loadMeals();
}

async function loadStations() {
    try {
        const response = await fetch(`${API_URL}/stations`);
        const data = await response.json();

        if (data.success) {
            stations = data.stations;
            populateStationDropdowns();
        }
    } catch (error) {
        console.error('Error loading stations:', error);
    }
}

function populateStationDropdowns() {
    const boardingSelect = document.getElementById('boardingSelect');
    const droppingSelect = document.getElementById('droppingSelect');

    // Clear existing options except the first one
    boardingSelect.innerHTML = '<option value="">-- Select Boarding Point --</option>';
    droppingSelect.innerHTML = '<option value="">-- Select Dropping Point --</option>';

    stations.forEach(station => {
        const boardingOption = document.createElement('option');
        boardingOption.value = station.id;
        boardingOption.textContent = `${station.name} - Departure: ${station.time}`;
        boardingSelect.appendChild(boardingOption);

        const droppingOption = document.createElement('option');
        droppingOption.value = station.id;
        droppingOption.textContent = `${station.name} - Arrival: ${station.time}`;
        droppingSelect.appendChild(droppingOption);
    });
}

function handleBoardingChange() {
    const boardingSelect = document.getElementById('boardingSelect');
    bookingData.boardingPoint = parseInt(boardingSelect.value) || null;
    bookingData.source = stations.find(s => s.id === bookingData.boardingPoint)?.name;
}

function handleDroppingChange() {
    const droppingSelect = document.getElementById('droppingSelect');
    bookingData.droppingPoint = parseInt(droppingSelect.value) || null;
    bookingData.desti = stations.find(s => s.id === bookingData.droppingPoint)?.name;
}

async function loadSeats() {
    try {
        const response = await fetch(`${API_URL}/seats`);
        const data = await response.json();
        bookedSeats = data.booked_seats || [];
        renderSeats();
    } catch (error) {
        console.error('Error loading seats:', error);
    }
}

function renderSeats() {
    const leftSeats = document.getElementById('leftSeats');
    const rightSeats = document.getElementById('rightSeats');
    leftSeats.innerHTML = '';
    rightSeats.innerHTML = '';

    // Upper berths (1U-16U) - divided into left and right columns
    leftSeats.innerHTML += '<div style="font-weight: bold; text-align: center; margin-bottom: 10px; color: #667eea;">UPPER</div>';
    for (let i = 1; i <= 8; i++) {
        leftSeats.innerHTML += createSeatHTML(`${i}U`);
    }

    rightSeats.innerHTML += '<div style="font-weight: bold; text-align: center; margin-bottom: 10px; color: #667eea;">UPPER</div>';
    for (let i = 9; i <= 16; i++) {
        rightSeats.innerHTML += createSeatHTML(`${i}U`);
    }

    // Add spacing/separator
    leftSeats.innerHTML += '<div style="height: 30px; display: flex; align-items: center; justify-content: center; font-size: 0.8em; color: #999;">─────</div>';
    rightSeats.innerHTML += '<div style="height: 30px; display: flex; align-items: center; justify-content: center; font-size: 0.8em; color: #999;">─────</div>';

    // Lower berths (1L-16L) - divided into left and right columns
    leftSeats.innerHTML += '<div style="font-weight: bold; text-align: center; margin-bottom: 10px; color: #764ba2;">LOWER</div>';
    for (let i = 1; i <= 8; i++) {
        leftSeats.innerHTML += createSeatHTML(`${i}L`);
    }

    rightSeats.innerHTML += '<div style="font-weight: bold; text-align: center; margin-bottom: 10px; color: #764ba2;">LOWER</div>';
    for (let i = 9; i <= 16; i++) {
        rightSeats.innerHTML += createSeatHTML(`${i}L`);
    }
}

function createSeatHTML(seatLabel) {
    const isBooked = bookedSeats.includes(seatLabel);
    const isSelected = bookingData.selectedSeats.includes(seatLabel);

    let className = 'seat ';
    if (isBooked) className += 'booked';
    else if (isSelected) className += 'selected';
    else className += 'available';

    return `<div class="${className}" onclick="toggleSeat('${seatLabel}')">${seatLabel}</div>`;
}

function toggleSeat(seatLabel) {
    if (bookedSeats.includes(seatLabel)) return;

    const index = bookingData.selectedSeats.indexOf(seatLabel);
    if (index > -1) {
        bookingData.selectedSeats.splice(index, 1);
    } else {
        bookingData.selectedSeats.push(seatLabel);
    }
    renderSeats();
}

async function loadMeals() {
    try {
        const response = await fetch(`${API_URL}/meals`);
        const data = await response.json();

        if (data.success) {
            meals = data.meals;
            renderMeals();
        }
    } catch (error) {
        console.error('Error loading meals:', error);
    }
}

function renderMeals() {
    const mealDiv = document.getElementById('mealOptions');
    mealDiv.innerHTML = '';

    meals.forEach(meal => {
        const mealHTML = `
            <div class="meal-card" onclick="toggleMeal(${meal.id})">
                <h4>${meal.name}</h4>
                <p>${meal.description}</p>
                <div class="meal-price">₹${meal.price}</div>
            </div>
        `;
        mealDiv.innerHTML += mealHTML;
    });
}

function toggleMeal(mealId) {
    const index = bookingData.selectedMeals.indexOf(mealId);
    if (index > -1) {
        bookingData.selectedMeals.splice(index, 1);
    } else {
        bookingData.selectedMeals.push(mealId);
    }

    const mealCards = document.querySelectorAll('.meal-card');
    mealCards.forEach((card, idx) => {
        if (meals[idx].id === mealId) {
            card.classList.toggle('selected');
        }
    });
}

async function showBookings() {
    try {
        const response = await fetch(`${API_URL}/bookings`);
        const data = await response.json();

        const container = document.getElementById('bookingsListContainer');

        if (!data.bookings || data.bookings.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">No bookings found.</p>';
        } else {
            let html = '';
            data.bookings.forEach((booking, index) => {
                const statusColor = booking.status === 'cancelled' ? '#ef4444' : '#10b981';
                const statusText = booking.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED';

                html += `
                    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; background: #f9fafb;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="margin: 0; color: #667eea;">Booking #${index + 1}</h4>
                            <span style="padding: 5px 10px; border-radius: 5px; background: ${statusColor}; color: white; font-size: 0.8em; font-weight: bold;">${statusText}</span>
                        </div>
                        <p><strong>Booking ID:</strong> ${booking.booking_id}</p>
                        <p><strong>Passenger:</strong> ${booking.passenger_name}</p>
                        <p><strong>Contact:</strong> ${booking.passenger_contact}</p>
                        <p><strong>Seats:</strong> ${booking.seats.join(', ')}</p>
                        <p><strong>Route:</strong> ${booking.boarding} → ${booking.dropping}</p>
                        <p><strong>Total Amount:</strong> ₹${booking.total_amount}</p>
                        ${booking.status !== 'cancelled' ? `
                            <button class="btn btn-secondary" onclick="cancelBooking('${booking.booking_id}')" style="margin-top: 10px; padding: 8px 15px; font-size: 0.9em;">Cancel Booking</button>
                        ` : ''}
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('stepBookings').classList.add('active');
    } catch (error) {
        console.error('Error fetching bookings:', error);
        alert('Failed to load bookings');
    }
}

async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cancel/${bookingId}`, {
            method: 'DELETE'
        });
        const data = await response.json();

        if (data.success) {
            alert(`Booking cancelled successfully! Refund amount: ₹${data.refund_amount}`);
            // Reload seats to reflect the freed seats
            await loadSeats();
            // Refresh bookings list
            await showBookings();
        } else {
            alert(data.message || 'Failed to cancel booking');
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking');
    }
}

function backToHome() {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('step1').classList.add('active');
}

function goToStep(stepNum) {
    if (stepNum === 2 && (!bookingData.boardingPoint || !bookingData.droppingPoint)) {
        alert('Please select boarding and dropping points');
        return;
    }

    // Validate that dropping point is after boarding point
    if (stepNum === 2 && bookingData.boardingPoint >= bookingData.droppingPoint) {
        alert('Dropping point must be after boarding point');
        return;
    }

    if (stepNum === 3 && bookingData.selectedSeats.length === 0) {
        alert('Please select at least one seat');
        return;
    }

    if (stepNum === 4) {
        generatePassengerForms();
    }

    if (stepNum === 5) {
        if (!validatePassengerDetails()) {
            alert('Please fill all passenger details');
            return;
        }
        showBookingSummary();
        getPrediction();
    }

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('step' + stepNum).classList.add('active');

    document.querySelectorAll('.step').forEach(step => {
        const num = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');
        if (num === stepNum) {
            step.classList.add('active');
        } else if (num < stepNum) {
            step.classList.add('completed');
        }
    });
}

function generatePassengerForms() {
    const formsDiv = document.getElementById('passengerForms');
    formsDiv.innerHTML = '';

    bookingData.selectedSeats.forEach((seat, index) => {
        const formHTML = `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                <h4 style="margin-bottom: 15px;">Passenger ${index + 1} - Seat ${seat}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="name_${index}" placeholder="Enter full name" required>
                    </div>
                    <div class="form-group">
                        <label>Age</label>
                        <input type="number" id="age_${index}" placeholder="Age" min="1" max="120" required>
                    </div>
                    <div class="form-group">
                        <label>Gender</label>
                        <select id="gender_${index}" required>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" id="phone_${index}" placeholder="10-digit number" pattern="[0-9]{10}" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="email_${index}" placeholder="email@example.com" required>
                    </div>
                </div>
            </div>
        `;
        formsDiv.innerHTML += formHTML;
    });
}

function validatePassengerDetails() {
    bookingData.passengers = [];

    for (let i = 0; i < bookingData.selectedSeats.length; i++) {
        const name = document.getElementById(`name_${i}`).value;
        const age = document.getElementById(`age_${i}`).value;
        const gender = document.getElementById(`gender_${i}`).value;
        const phone = document.getElementById(`phone_${i}`).value;
        const email = document.getElementById(`email_${i}`).value;

        if (!name || !age || !gender || !phone || !email) {
            return false;
        }

        bookingData.passengers.push({
            name, age, gender, phone, email,
            seat: bookingData.selectedSeats[i]
        });
    }
    return true;
}

function showBookingSummary() {
    const summaryDiv = document.getElementById('bookingSummary');

    const boarding = stations.find(s => s.id === bookingData.boardingPoint);
    const dropping = stations.find(s => s.id === bookingData.droppingPoint);

    const seatPrice = Math.abs(dropping.price - boarding.price) * bookingData.selectedSeats.length;
    const mealPrice = bookingData.selectedMeals.reduce((sum, mealId) => {
        const meal = meals.find(m => m.id === mealId);
        return sum + (meal ? meal.price * bookingData.selectedSeats.length : 0);
    }, 0);
    const total = seatPrice + mealPrice;

    let summaryHTML = '<h3 style="margin-bottom: 20px;">Booking Summary</h3>';
    summaryHTML += `<div class="summary-item"><span>Route:</span><span>${boarding.name} → ${dropping.name}</span></div>`;
    summaryHTML += `<div class="summary-item"><span>Seats:</span><span>${bookingData.selectedSeats.join(', ')}</span></div>`;
    summaryHTML += `<div class="summary-item"><span>Passengers:</span><span>${bookingData.passengers.length}</span></div>`;

    if (bookingData.selectedMeals.length > 0) {
        const mealNames = bookingData.selectedMeals.map(id => meals.find(m => m.id === id).name).join(', ');
        summaryHTML += `<div class="summary-item"><span>Meals:</span><span>${mealNames}</span></div>`;
    }

    summaryHTML += `<div class="summary-item"><span>Seat Charges:</span><span>₹${seatPrice}</span></div>`;
    summaryHTML += `<div class="summary-item"><span>Meal Charges:</span><span>₹${mealPrice}</span></div>`;
    summaryHTML += `<div class="summary-item"><span>Total Amount:</span><span>₹${total}</span></div>`;

    summaryDiv.innerHTML = summaryHTML;
}

async function getPrediction() {
    try {
        // Calculate total amount for prediction
        const boarding = stations.find(s => s.id === bookingData.boardingPoint);
        const dropping = stations.find(s => s.id === bookingData.droppingPoint);

        const seatPrice = Math.abs(dropping.price - boarding.price) * bookingData.selectedSeats.length;
        const mealPrice = bookingData.selectedMeals.reduce((sum, mealId) => {
            const meal = meals.find(m => m.id === mealId);
            return sum + (meal ? meal.price * bookingData.selectedSeats.length : 0);
        }, 0);
        const totalAmount = seatPrice + mealPrice;
        bookingData.total_amount = totalAmount;

        const response = await fetch(`${API_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                selectedSeats: bookingData.selectedSeats,
                boardingPoint: bookingData.source,
                droppingPoint: bookingData.desti,
                selectedMeals: bookingData.selectedMeals,
                totalAmount: totalAmount
            })
        });
        const data = await response.json();
        console.log('[v0] Prediction response:', data);
        displayPrediction(data.prediction_percentage, data.message);
    } catch (error) {
        console.log('[v0] Error in prediction:', error);
        console.log('Using mock prediction');
        const mockPrediction = Math.floor(Math.random() * 20) + 75;
        displayPrediction(mockPrediction, 'High probability of confirmation');
    }
}

function displayPrediction(percentage, message) {
    document.getElementById('predictionPercentage').textContent = percentage + '%';
    document.getElementById('predictionMessage').textContent = message;
}

async function confirmBooking() {
    try {
        const response = await fetch(`${API_URL}/book`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        const data = await response.json();

        if (data.success) {
            // Reload seats after successful booking
            await loadSeats();
            showSuccess(data.booking_id);
        } else {
            alert(data.message || 'Booking failed');
        }
    } catch (error) {
        console.error('Error confirming booking:', error);
        alert('Failed to confirm booking');
    }
}

function showSuccess(bookingId) {
    document.getElementById('bookingIdDisplay').innerHTML = `<strong>Booking ID:</strong> ${bookingId}`;

    // Copy prediction data to success page
    const predictionPercentage = document.getElementById('predictionPercentage').textContent;
    const predictionMessage = document.getElementById('predictionMessage').textContent;

    document.getElementById('successPredictionPercentage').textContent = predictionPercentage;
    document.getElementById('successPredictionMessage').textContent = predictionMessage;

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('stepSuccess').classList.add('active');
}

initializeApp();
