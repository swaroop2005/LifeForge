import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import User, Donor, Patient, BloodBank, Donation
from app.auth import hash_password

MARKER_EMAIL = "synthetic_seed_v1@vitatrace.internal"

BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
DISEASES = ["thalassemia", "sickle_cell", "hemophilia", "anemia", "aplastic_anemia"]

DONOR_NAMES = [
    "Aarav Singh", "Vivaan Sharma", "Aditya Verma", "Vihaan Patel", "Arjun Mehta",
    "Sai Krishna", "Reyan Nair", "Ayaan Khan", "Dhruv Kapoor", "Kabir Joshi",
    "Ishaan Rao", "Rohan Malhotra", "Nikhil Gupta", "Karan Sinha", "Amit Dubey",
    "Raj Chauhan", "Dev Pillai", "Suresh Iyer", "Mahesh Reddy", "Vikram Bose",
    "Anand Kumar", "Prakash Menon", "Sanjay Tiwari", "Ramesh Naidu", "Deepak Yadav",
    "Pavan Nair", "Ganesh Patil", "Harish Sharma", "Sachin Rathore", "Mohan Das",
    "Priya Kumari", "Ananya Roy", "Divya Pillai", "Meera Iyer", "Kavya Reddy",
    "Pooja Sharma", "Sneha Nair", "Ria Gupta", "Tanya Singh", "Swati Verma",
    "Nisha Patel", "Riya Mehta", "Sanya Kapoor", "Diya Joshi", "Kriti Rao",
    "Aisha Khan", "Tanvi Malhotra", "Shweta Sinha", "Mamta Dubey", "Kavitha Iyer",
    "Ramya Reddy", "Lakshmi Naidu", "Geeta Devi", "Sunita Yadav", "Usha Rani",
    "Deepa Menon", "Saranya Pillai", "Vaishnavi Kumar", "Sindhu Nair", "Akshara Patil",
    "Yash Tiwari", "Aryan Bose", "Shiv Kumar", "Gaurav Das", "Rahul Jha",
    "Sumit Roy", "Alok Chatterjee", "Bimal Sen", "Chandan Ghosh", "Dipak Biswas",
    "Pritam Hazra", "Subhash Pal", "Tapan Saha", "Uttam Mondal", "Asim Dey",
    "Farhan Ahmed", "Imran Ali", "Salman Shaikh", "Tariq Hussain", "Bilal Ansari",
    "Rajan Thomas", "Binu Jose", "Shijo Mathew", "Anil Kurian", "Jijo Abraham",
    "Naveen Kumar", "Praveen Raj", "Sathish Babu", "Muthukumar", "Selvam Ramasamy",
    "Gopal Krishnan", "Venkat Raman", "Balaji Suresh", "Karthik Sundaram", "Surya Prakash",
    "Hemant Bhatt", "Girish Shah", "Nitin Desai", "Paresh Modi", "Rajesh Trivedi",
    "Jitendra Solanki", "Hitesh Panchal", "Bhavesh Thakkar", "Chirag Jain", "Piyush Agarwal",
]

PATIENT_NAMES = [
    "Asha Devi", "Gita Bai", "Rekha Patel", "Seema Verma", "Lata Sharma",
    "Radha Rani", "Sushila Devi", "Kamla Devi", "Malati Roy", "Chandana Das",
    "Bhavna Shah", "Renu Gupta", "Jyoti Singh", "Manju Yadav", "Sarla Tiwari",
    "Pushpa Kumari", "Kaveri Nair", "Leela Menon", "Ammini Pillai", "Sudha Iyer",
    "Padma Reddy", "Vijaya Lakshmi", "Saraswathi Devi", "Ambika Naidu", "Revathi Rao",
    "Arun Krishnan", "Babu Raj", "Chandra Mohan", "Dinesh Babu", "Elamaran",
    "Fathima Begum", "Gulnaz Khan", "Hamida Bano", "Irfan Begum", "Jabeen Sultana",
    "Kiran Bala", "Lalita Devi", "Manjula Devi", "Nirmala Devi", "Omana Thomas",
    "Parvathi Amma", "Quamrul Nisha", "Ratna Kumari", "Savitri Devi", "Thankamma",
    "Usha Kumari", "Vasantha Devi", "Wajida Begum", "Yasmin Banu", "Zubeda Khatun",
    "Akbar Ali", "Badrul Islam", "Chand Mia", "Daud Khan", "Ejaz Ahmed",
    "Firoz Shaikh", "Ghulam Nabi", "Harun Rashid", "Ismail Hossain", "Jalal Uddin",
    "Kartik Biswas", "Lakhan Pal", "Mahendra Singh", "Narayan Das", "Om Prakash",
    "Pramod Kumar", "Raghunath Panda", "Shyamal Ghosh", "Tarun Dey", "Uday Mondal",
    "Venu Gopal", "Wamanrao Patil", "Xaveria D'Souza", "Yusuf Tamboli", "Zakir Shaikh",
    "Anita Rodrigues", "Bella Miranda", "Clara Fernandes", "Diana Gomes", "Eva Pinto",
    "Felix Mascarenhas", "Grace D'Costa", "Hilario Pereira", "Irene Lobo", "Jerome Souza",
    "Krishnabai Naik", "Laxmibai Sawant", "Meenabai Gawde", "Narmada Velip", "Omkar Dessai",
    "Pramila Amonkar", "Rajaram Gaonkar", "Shanta Naik", "Tukaram Parkar", "Uttam Khandeparkar",
    "Anbu Selvi", "Bharathi Devi", "Chitra Devi", "Devi Priya", "Eswari Devi",
    "Fatima Zohra", "Geetha Kumari", "Hema Latha", "Indira Devi", "Jaya Lakshmi",
]

STATES_CITIES = [
    ("Telangana", "Hyderabad"), ("Telangana", "Warangal"), ("Telangana", "Nizamabad"),
    ("Andhra Pradesh", "Visakhapatnam"), ("Andhra Pradesh", "Vijayawada"), ("Andhra Pradesh", "Guntur"),
    ("Tamil Nadu", "Chennai"), ("Tamil Nadu", "Coimbatore"), ("Tamil Nadu", "Madurai"),
    ("Karnataka", "Bengaluru"), ("Karnataka", "Mysuru"), ("Karnataka", "Hubballi"),
    ("Maharashtra", "Mumbai"), ("Maharashtra", "Pune"), ("Maharashtra", "Nagpur"),
    ("Delhi", "New Delhi"), ("Delhi", "North Delhi"), ("Delhi", "South Delhi"),
    ("Uttar Pradesh", "Lucknow"), ("Uttar Pradesh", "Kanpur"), ("Uttar Pradesh", "Agra"),
    ("West Bengal", "Kolkata"), ("West Bengal", "Howrah"), ("West Bengal", "Durgapur"),
    ("Rajasthan", "Jaipur"), ("Rajasthan", "Jodhpur"), ("Rajasthan", "Udaipur"),
    ("Gujarat", "Ahmedabad"), ("Gujarat", "Surat"), ("Gujarat", "Vadodara"),
    ("Punjab", "Amritsar"), ("Punjab", "Ludhiana"), ("Punjab", "Jalandhar"),
    ("Madhya Pradesh", "Bhopal"), ("Madhya Pradesh", "Indore"), ("Madhya Pradesh", "Jabalpur"),
    ("Kerala", "Thiruvananthapuram"), ("Kerala", "Kochi"), ("Kerala", "Kozhikode"),
    ("Bihar", "Patna"), ("Bihar", "Gaya"), ("Bihar", "Muzaffarpur"),
    ("Odisha", "Bhubaneswar"), ("Odisha", "Cuttack"), ("Odisha", "Rourkela"),
    ("Assam", "Guwahati"), ("Assam", "Dibrugarh"), ("Assam", "Jorhat"),
    ("Jharkhand", "Ranchi"), ("Jharkhand", "Jamshedpur"), ("Jharkhand", "Dhanbad"),
    ("Chhattisgarh", "Raipur"), ("Chhattisgarh", "Bilaspur"), ("Chhattisgarh", "Durg"),
    ("Haryana", "Gurugram"), ("Haryana", "Faridabad"), ("Haryana", "Ambala"),
    ("Himachal Pradesh", "Shimla"), ("Himachal Pradesh", "Mandi"),
    ("Uttarakhand", "Dehradun"), ("Uttarakhand", "Haridwar"),
]

def _rand_date(days_back_min=30, days_back_max=730):
    return datetime.utcnow() - timedelta(days=random.randint(days_back_min, days_back_max))

def seed_synthetic(db: Session):
    if db.query(User).filter(User.email == MARKER_EMAIL).first():
        return

    # Marker user so we don't re-seed
    db.add(User(email=MARKER_EMAIL, password_hash=hash_password("unused"), role="admin"))
    db.flush()

    # Get real blood bank IDs for donation records
    bank_ids = [b.id for b in db.query(BloodBank).limit(200).all()]
    if not bank_ids:
        bank_ids = [None]

    random.seed(42)
    donor_names = DONOR_NAMES.copy()
    random.shuffle(donor_names)

    # ── 100 Donors ──────────────────────────────────────────────────────────
    for i, name in enumerate(donor_names[:100]):
        state, city = random.choice(STATES_CITIES)
        blood_type = random.choice(BLOOD_TYPES)
        num_donations = random.choices(
            range(0, 35),
            weights=[2]*5 + [4]*5 + [6]*5 + [5]*5 + [4]*5 + [3]*5 + [1]*4 + [0.5],
            k=1
        )[0]

        email = f"donor{i+1:03d}@vitatrace.synthetic"
        user = User(email=email, password_hash=hash_password("Donor@123"), role="donor")
        db.add(user)
        db.flush()

        points = 0
        if num_donations > 0:
            points = 100 + (num_donations - 1) * 50

        # Badge from gamification thresholds
        badge = "Aspiring Soul"
        if num_donations >= 25: badge = "Hero"
        elif num_donations >= 10: badge = "Lifesaver"
        elif num_donations >= 1: badge = "First Drop"

        last_don = _rand_date(30, 400) if num_donations > 0 else None
        is_long_term = num_donations >= 5

        donor = Donor(
            user_id=user.id, name=name, blood_type=blood_type,
            city=city, state=state, points=points, badge=badge,
            is_long_term=is_long_term, last_donation_date=last_don,
        )
        db.add(donor)
        db.flush()

        # Create actual donation records
        for j in range(num_donations):
            don_date = _rand_date(30 + j * 60, 60 + j * 60)
            db.add(Donation(
                donor_id=donor.id,
                bank_id=random.choice(bank_ids),
                blood_type=blood_type,
                quantity=random.randint(1, 2),
                donated_at=don_date,
            ))

    # ── 100 Patients ─────────────────────────────────────────────────────────
    patient_names = PATIENT_NAMES.copy()
    random.shuffle(patient_names)

    for i, name in enumerate(patient_names[:100]):
        state, city = random.choice(STATES_CITIES)
        blood_type = random.choice(BLOOD_TYPES)
        disease = random.choice(DISEASES)

        email = f"patient{i+1:03d}@vitatrace.synthetic"
        user = User(email=email, password_hash=hash_password("Patient@123"), role="patient")
        db.add(user)
        db.flush()

        db.add(Patient(
            user_id=user.id, name=name, blood_type=blood_type,
            disease=disease, city=city, state=state,
            next_transfusion_date=_rand_date(-60, -7) if random.random() > 0.4 else None,
        ))

    db.commit()
    print("Seeded 100 synthetic donors + 100 synthetic patients")
