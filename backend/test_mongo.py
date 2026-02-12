import pymongo

try:
    # Try to connect
    client = pymongo.MongoClient("mongodb://localhost:27017")
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB is connected!")
    
    # List databases
    print("📊 Databases found:")
    for db_name in client.list_database_names():
        print(f"   - {db_name}")
    
    # Check your database
    if 'ship_inspections' not in client.list_database_names():
        print("📝 Database 'ship_inspections' will be created automatically")
    else:
        print("✅ Database 'ship_inspections' exists!")
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print("\n🔧 To fix:")
    print("1. Install MongoDB from: https://www.mongodb.com/try/download/community")
    print("2. Start MongoDB service:")
    print("   Windows: 'net start MongoDB'")
    print("   Mac: 'brew services start mongodb-community'")
    print("   Linux: 'sudo systemctl start mongod'")