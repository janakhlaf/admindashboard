from sqlalchemy import Column, Integer, String, Text, ForeignKey, Numeric, BigInteger
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String)
    password_hash = Column(Text)
    bio = Column(Text)
    role = Column(String)


class Film(Base):
    __tablename__ = "films"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    description = Column(Text)
    category = Column(String)
    thumbnail_url = Column(Text)
    bucket_path = Column(Text)
    mime_type = Column(String)
    price = Column(Numeric)
    source_type = Column(String)
    status = Column(String)
    rejection_reason = Column(Text)
    duration = Column(String)
    file_size = Column(String)
    thumbnail_basic = Column(Text)


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    description = Column(Text)
    category = Column(String)
    preview_url = Column(Text)
    bucket_path = Column(Text)
    file_type = Column(String)
    file_size = Column(BigInteger)
    price = Column(Numeric)
    source_type = Column(String)
    status = Column(String)
    rejection_reason = Column(Text)


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"))
    action_type = Column(String)
    target_table = Column(String)
    target_id = Column(Integer)