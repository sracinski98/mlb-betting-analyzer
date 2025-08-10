import streamlit as st
import json
import pandas as pd

def analyze_job(job):
    skills = job.get("skills", [])
    ease = 10 if "React" in skills else 5
    time_hours = 4 if "Python" in skills else 12
    expertise = "intermediate" if "Python" in skills else "beginner"
    pay_str = str(job.get("pay", "0")).replace("$", "").replace(",", "")
    try:
        pay = float(pay_str)
    except ValueError:
        pay = 0.0
    # Example: infer category from skills, or set default
    if "Python" in skills:
        category = "Programming"
    elif "SEO" in " ".join(skills):
        category = "Marketing"
    else:
        category = "Other"
    worth_it = "yes" if pay / max(time_hours, 1) > 30 else "no"
    return {
        **job,
        "pay": pay,
        "ease": ease,
        "time_hours": time_hours,
        "expertise": expertise,
        "worth_it": worth_it,
        "category": category
    }

st.title("Freelance Job Listing Analyzer")
st.sidebar.header("Job Listing Input")
json_input = st.sidebar.text_area("Paste job listings JSON here", height=200)

if json_input:
    try:
        jobs = json.loads(json_input)
        st.success("Loaded job listings!")
        analyzed_jobs = [analyze_job(job) for job in jobs]
        df = pd.DataFrame(analyzed_jobs)
        sort_by = st.selectbox("Sort jobs by", ["pay", "ease", "time_hours", "worth_it"])
        df_sorted = df.sort_values(by=sort_by, ascending=False if sort_by != "time_hours" else True)
        worth_filter = st.selectbox("Worth doing?", ["All", "yes", "no"])
        expertise_filter = st.selectbox("Expertise level", ["All", "beginner", "intermediate", "advanced"])

        filtered_df = df_sorted
        if worth_filter != "All":
            filtered_df = filtered_df[filtered_df["worth_it"] == worth_filter]
        if expertise_filter != "All":
            filtered_df = filtered_df[filtered_df["expertise"] == expertise_filter]

        st.dataframe(filtered_df[["title", "description", "pay", "skills", "ease", "time_hours", "expertise", "worth_it"]])
    except Exception as e:
        st.error(f"Invalid JSON: {e}")
else:
    st.info("Paste job listings JSON in the sidebar to begin analysis.")