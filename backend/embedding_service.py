import os
from dotenv import load_dotenv
from openai import OpenAI
from sqlalchemy import text

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EMBEDDING_MODEL = "text-embedding-3-small"


def create_embedding(text_value: str):
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text_value
    )

    return response.data[0].embedding


def embedding_to_pgvector(embedding):
    return "[" + ",".join(str(x) for x in embedding) + "]"


def tags_to_text(tags):
    if not tags:
        return ""

    if isinstance(tags, list):
        return ", ".join(tags)

    return str(tags)


def generate_film_embedding(db, film):
    tags_text = tags_to_text(film.tags)

    text_value = f"""
Title: {film.title}
Category: {film.category}
Tags: {tags_text}
Description: {film.description}
""".strip()

    embedding = create_embedding(text_value)

    pg_vector = embedding_to_pgvector(embedding)

    db.execute(
        text("""
            UPDATE films
            SET embedding = CAST(:embedding AS vector)
            WHERE id = :film_id
        """),
        {
            "embedding": pg_vector,
            "film_id": film.id,
        }
    )

    db.commit()


def generate_asset_embedding(db, asset):
    tags_text = tags_to_text(asset.tags)

    text_value = f"""
Asset Name: {asset.name}
Category: {asset.category}
File Type: {asset.file_type}
Tags: {tags_text}
Description: {asset.description}
""".strip()

    embedding = create_embedding(text_value)

    pg_vector = embedding_to_pgvector(embedding)

    db.execute(
        text("""
            UPDATE assets
            SET embedding = CAST(:embedding AS vector)
            WHERE id = :asset_id
        """),
        {
            "embedding": pg_vector,
            "asset_id": asset.id,
        }
    )

    db.commit()