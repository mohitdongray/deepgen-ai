from app.jobs.job_store import JobStore

def test_jobstore():
    """Test JobStore directly"""
    
    print("🧪 Testing JobStore...")
    
    # 1. Add job
    print("\n1️⃣ Adding job...")
    JobStore.add_job("test_store", {
        "job_id": "test_store",
        "status": "pending",
        "created_at": "2026-02-15T13:40:00Z",
        "metadata": {"test": True}
    })
    
    # 2. Get job
    print("\n2️⃣ Getting job...")
    job = JobStore.get_job("test_store")
    print(f"Retrieved job: {job}")
    
    # 3. Update job
    print("\n3️⃣ Updating job...")
    JobStore.update_job("test_store", 
        status="completed",
        result={"videoUrl": "https://test.mp4"},
        provider="test_provider"
    )
    
    # 4. Get updated job
    print("\n4️⃣ Getting updated job...")
    updated_job = JobStore.get_job("test_store")
    print(f"Updated job: {updated_job}")
    
    # 5. List all jobs
    print("\n5️⃣ Listing all jobs...")
    all_jobs = JobStore.list_jobs()
    print(f"All jobs: {all_jobs}")
    
    # 6. Get count
    print(f"\n6️⃣ Job count: {JobStore.get_job_count()}")
    
    # 7. Clean up
    print("\n7️⃣ Cleaning up...")
    JobStore.delete_job("test_store")
    final_job = JobStore.get_job("test_store")
    print(f"Job after deletion: {final_job}")
    
    print(f"\n✅ JobStore test complete!")

if __name__ == "__main__":
    test_jobstore()
