def ingest_job_listings(json_input):
    import json

    try:
        job_listings = json.loads(json_input)
        structured_listings = []

        for job in job_listings:
            structured_listing = {
                "title": job.get("title"),
                "company": job.get("company"),
                "location": job.get("location"),
                "pay": job.get("pay"),
                "description": job.get("description"),
                "skills": job.get("skills", [])
            }
            structured_listings.append(structured_listing)

        return structured_listings

    except json.JSONDecodeError:
        raise ValueError("Invalid JSON input")