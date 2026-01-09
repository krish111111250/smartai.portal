from .database import SessionLocal, engine
from . import models

def seed_data():
    db = SessionLocal()
    # Create tables if they don't exist
    models.Base.metadata.create_all(bind=engine)

    # Check if we already have students
    if db.query(models.Student).count() == 0:
        test_students = [
            models.Student(
                name="Rahul Sharma",
                roll_no="22CSE01",
                dept="Computer Science",
                apaar_id="APAAR-12345",
                email="22cse01@sns.edu",
                photo_b64="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
            ),
            models.Student(
                name="Priya Patel",
                roll_no="22ECE45",
                dept="Electronics",
                apaar_id="APAAR-67890",
                email="22ece45@sns.edu",
                photo_b64="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
            )
        ]
        db.add_all(test_students)
        db.commit()
        print("✅ Demo students added successfully!")
    else:
        print("✨ Students already exist in database.")
    db.close()

if __name__ == "__main__":
    seed_data()