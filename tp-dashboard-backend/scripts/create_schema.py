from app.core.database import Base, engine
from app.models.sys_metadata import UploadHistory

print("Creating all tables...")
Base.metadata.create_all(engine)
print("Done.")
