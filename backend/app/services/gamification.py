from sqlalchemy.orm import Session
from app.models import Donor, Donation

BADGE_RULES = [(1, "First Drop"), (10, "Lifesaver"), (25, "Hero")]

def award_points(donor: Donor, db: Session, points: int):
    donor.points += points
    count = db.query(Donation).filter(Donation.donor_id == donor.id).count()
    for threshold, badge in BADGE_RULES:
        if count >= threshold:
            donor.badge = badge
    db.commit()
