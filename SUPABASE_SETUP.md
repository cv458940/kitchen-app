# Supabase Setup Instructions

Your Kitchen Lists app is now integrated with Supabase! Follow these steps to complete the setup.

## Step 1: Run the Database Migration

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `qotwmbeawwxlmbzuhazt`

2. **Navigate to the SQL Editor**
   - Click on the **SQL Editor** icon in the left sidebar
   - Click **"New Query"** button

3. **Copy and paste the migration script**
   - Open the file `supabase-migration.sql` in this folder
   - Copy the entire contents
   - Paste it into the SQL Editor

4. **Run the migration**
   - Click the **"Run"** button (or press Ctrl/Cmd + Enter)
   - You should see a success message

5. **Verify the tables were created**
   - Click on the **Table Editor** icon in the left sidebar
   - You should see three new tables:
     - `users`
     - `checklists`
     - `tasks`

## Step 2: Verify the Default Admin User

1. In the **Table Editor**, click on the `users` table
2. You should see one row with:
   - **username**: Admin
   - **role**: admin
   - **password**: password

## Step 3: Test the Application

1. **Open your app** (using your preferred method from the README)
2. **Login as Admin**:
   - Select "Admin (admin)" from the dropdown
   - Enter password: `password`
   - Click "Login"

3. **Create a test user**:
   - Click "👥 Manage Users"
   - Add a new employee or manager
   - Test logging in as that user

4. **Create a checklist and tasks**:
   - Create a new checklist
   - Add some tasks with different types (checkbox, temperature, text)
   - Complete some tasks
   - Add comments

## What Changed?

### ✅ Data Storage
- **Before**: All data was stored in localStorage (browser only)
- **After**: All data is stored in Supabase PostgreSQL database

### ✅ Multi-Device Sync
- Your data is now accessible from any device
- Changes sync automatically when you refresh the page
- Multiple users can access the same data

### ✅ Data Persistence
- Data won't be lost if you clear browser cache
- More reliable and scalable
- Better for production use

### ✅ Security
- Row Level Security (RLS) policies protect your data
- Proper database structure with foreign keys
- Validates data at the database level

## Database Schema

### Users Table
- `id` (UUID): Primary key
- `username` (TEXT): Unique username
- `role` (TEXT): 'admin', 'manager', or 'employee'
- `password` (TEXT): Optional, only for admin/manager
- `created_at` (TIMESTAMP): When user was created

### Checklists Table
- `id` (UUID): Primary key
- `name` (TEXT): Checklist name
- `owner_id` (UUID): Foreign key to users table
- `created_at` (TIMESTAMP): When checklist was created

### Tasks Table
- `id` (UUID): Primary key
- `checklist_id` (UUID): Foreign key to checklists table
- `text` (TEXT): Task description
- `type` (TEXT): 'checkbox', 'temperature', or 'text'
- `value` (TEXT): Value for temperature/text tasks
- `completed` (BOOLEAN): For checkbox tasks
- `completed_at` (TIMESTAMP): When task was completed
- `completed_by` (UUID): Foreign key to users table
- `comment` (TEXT): Task comment
- `position` (INTEGER): Task order
- `created_at` (TIMESTAMP): When task was created

## Troubleshooting

### Problem: "Failed to initialize app"
- **Solution**: Make sure you ran the SQL migration script
- Check the browser console for specific error messages
- Verify your Supabase URL and anon key are correct in `app.js`

### Problem: "Failed to add user/checklist/task"
- **Solution**: Check the browser console for errors
- Verify RLS policies are enabled (they should be from the migration)
- Make sure you're logged in as a user with proper permissions

### Problem: Data not showing up
- **Solution**:
  - Refresh the page to reload data from Supabase
  - Check the Supabase Table Editor to see if data exists
  - Clear your browser cache and reload

### Problem: "Cannot read property 'id' of undefined"
- **Solution**: Make sure you ran the complete migration including the default Admin user
- Try manually inserting the Admin user in the Table Editor

## Next Steps

### Optional Enhancements

1. **Real-time Updates**
   - Add Supabase real-time subscriptions
   - See changes instantly across devices without refresh

2. **Proper Authentication**
   - Use Supabase Auth instead of simple password check
   - Add password reset functionality
   - Email verification

3. **Advanced Features**
   - Export data to PDF or Excel
   - Add date filtering for historical data
   - Task templates and recurring tasks
   - Email notifications for incomplete tasks

4. **Data Migration**
   - If you have existing localStorage data, you can write a script to migrate it to Supabase
   - Contact me if you need help with this

## Support

If you encounter any issues:
1. Check the browser console (F12) for error messages
2. Check the Supabase logs in your dashboard
3. Verify all tables and RLS policies were created correctly
4. Make sure your app is connecting to the correct Supabase project

Enjoy your new cloud-powered Kitchen Lists app! 🍳
