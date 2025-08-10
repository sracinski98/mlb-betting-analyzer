def rank_jobs(analyzed_job_listings):
    ranked_jobs = sorted(analyzed_job_listings, key=lambda job: (job['pay'], job['required_effort'], job['expertise_level']), reverse=True)
    return ranked_jobs