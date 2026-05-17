@router.put("/films/{film_id}")
def edit_film(
    film_id: int,
    title: str,
    description: str,
    category: str,
):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        UPDATE films
        SET
            title = %s,
            description = %s,
            category = %s
        WHERE id = %s
        RETURNING id
    """, (
        title,
        description,
        category,
        film_id
    ))

    updated = cur.fetchone()

    conn.commit()

    cur.close()
    conn.close()

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Film not found"
        )

    return {
        "message": "Film updated successfully"
    }