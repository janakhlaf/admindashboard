from sqlalchemy import Column, Integer, String, Text, ForeignKey
from database import Base


class User(Base):
    tablename = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(Text)
    bio = Column(Text)
    role = Column(String)


class Film(Base):
    tablename = "films"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    title = Column(String)
    description = Column(Text)
    category = Column(String)

    thumbnail_url = Column(Text)
    bucket_path = Column(Text)

    mime_type = Column(String)
    price = Column(String)

    source_type = Column(String)
    status = Column(String)

    rejection_reason = Column(Text)

    duration = Column(String)
    file_size = Column(String)


class Asset(Base):
    tablename = "assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    name = Column(String)
    description = Column(Text)
    category = Column(String)

    preview_url = Column(Text)
    bucket_path = Column(Text)

    file_type = Column(String)
    file_size = Column(String)

    price = Column(String)

    source_type = Column(String)
    status = Column(String)

    rejection_reason = Column(Text)


class AdminLog(Base):
    tablename = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)

    admin_id = Column(Integer, ForeignKey("users.id"))

    action_type = Column(String)
    target_table = Column(String)
    target_id = Column(Integer)
